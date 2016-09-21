import { exception } from "./exceptionHandlers";
import * as Rx from "rxjs";
import { ICompiledExpression, IDataContext } from "./interfaces";
import { isRxObservable, setToArray } from "./utils";

// export class RuntimeHooks<T> {
//     constructor(public captured: Set<Rx.Observable<T>>) {}

//     readFieldHook(o: any, field: string): T | Rx.Observable<T> {
//         // handle "@propref" access-modifier
//         let noUnwrap = false;

//         if (field[0] === "@") {
//             noUnwrap = true;
//             field = field.substring(1);
//         }

//         let result = o[field];

//         // intercept access to observable properties
//         if (isProperty(result)) {
//             let prop =  <Rx.Observable<T>> result;

//             // get the property's real value
//             if (!noUnwrap)
//                 result = prop();

//             // register observable
//             if (this.captured)
//                 this.captured.add(prop);
//         }

//         return result;
//     }

//     writeFieldHook(o: any, field: string, newValue: T): T {
//         // ignore @propref access-modifier on writes
//         if (field[0] === "@") {
//             field = field.substring(1);
//         }

//         let target = o[field];

//         // intercept access to observable properties
//         if (isProperty(target)) {
//             let prop = <Rx.Observable<T>> target;

//             // register observable
//             if (this.captured)
//                 this.captured.add(prop);

//             // replace field assignment with property invocation
//             prop(newValue);
//         } else {
//             o[field] = newValue;
//         }

//         return newValue;
//     }

//     readIndexHook(o: Array<T> | Rx.Observable<T[]>, index: number): T {
//         let result: T | Rx.Observable<T>;
//         // recognize observable lists
//         if (isList(o)) {
//             // translate indexer to list.get()
//             let list = <Rx.Observable<T[]>> o;
//             result = list()[index];

//             // add collectionChanged to monitored observables
//             if (this.captured)
//                 this.captured.add(<any>list);
//         } else {
//             result = o[index];
//         }

//         // intercept access to observable properties
//         if (isProperty(result)) {
//             let prop = <Rx.Observable<T>> result;

//             // get the property's real value
//             result = prop();

//             // register observable
//             if (this.captured)
//                 this.captured.add(prop);
//         }

//         return <T>result;
//     }

//     writeIndexHook(o: Array<T | Rx.Observable<T>> | Rx.Observable<Rx.Observable<T>[]>, index: number, newValue: T): T {
//         // recognize observable lists
//         if (isList(o)) {
//             // translate indexer to list.get()
//             let list = <Rx.Observable<T[] | Rx.Observable<T[]>>> <any>o;
//             let target = list()[index];

//             // add collectionChanged to monitored observables
//             if (this.captured)
//                 this.captured.add(<any>list);

//             // intercept access to observable properties
//             if (isProperty(target)) {
//                 let prop = <Rx.Observable<T>> target;

//                 // register observable
//                 if (this.captured)
//                     this.captured.add(prop);

//                 // replace field assignment with property invocation
//                 prop(newValue);
//             } else {
//                 // list.set(index, newValue);
//             }

//         } else {
//             // intercept access to observable properties
//             if (isProperty(o[index])) {
//                 let prop = <Rx.Observable<T>> o[index];

//                 // register observable
//                 if (this.captured)
//                     this.captured.add(prop);

//                 // replace field assignment with property invocation
//                 prop(newValue);
//             } else {
//                 o[index] = newValue;
//             }
//         }
//         return newValue;
//     }
// }



function canWrite(expression: string): boolean {
    const javaScriptReservedWords = ["true", "false", "null", "undefined"];

    // Matches something that can be assigned to--either an isolated identifier or something ending with a property accessor
    // This is designed to be simple and avoid false negatives, but could produce false positives (e.g., a+b.c).
    // This also will not properly handle nested brackets (e.g., obj1[obj2['prop']]; see #911).
    const javaScriptAssignmentTarget = /^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i;
    if (javaScriptReservedWords.indexOf(expression) >= 0) {
        return false;
    }
    const match = expression.match(javaScriptAssignmentTarget);
    return match !== null;
}

export function compileBindingExpression<T>(expression: string): ICompiledExpression<T | null> {
    expression = expression.trim();
    let fn: ICompiledExpression<T | null>;
    if (expression === "") {
        fn = ($context?, $element?) => null;
    }
    const readBody = `with($context){with($data||{}){return ${expression};}}`;
    fn = <any> new Function("$context", "$element", readBody);
    if (canWrite(expression)) {
        const writeBody = `with($context){with($data||{}){return function(_z){ ${expression} = _z;}}}`;
        fn.write = <any> new Function("$context", "$element", writeBody);
    }
    return fn;
}

export function evaluateExpression<T>(exp: ICompiledExpression<T>, ctx: IDataContext, element: Element): T | null {
    try {
        let result = exp(ctx, element);
        return result;
    } catch (e) {
        exception.next(e);
    }
    return null;
}

export function expressionToObservable<T>(exp: ICompiledExpression<T>, ctx: IDataContext): Rx.Observable<T | null> {
    let captured = new Set<Rx.Observable<T>>();
    let locals: any;
    let result: T | Rx.Observable<T>;

    // initial evaluation
    try {
        result = exp(ctx, locals);
    } catch (e) {
        exception.next(e);
        return Rx.Observable.of(null);
    }

    // Optimization: If the initial evaluation didn't touch any observables, treat it as constant expression
    if (captured.size === 0) {
        if (isRxObservable(result)) {
            return result;
        } else { // wrap it
            return Rx.Observable.of(result);
        }
    }

    // create a subject that receives values from all dependencies
    let allSeeingEye = new Rx.Subject<T>();

    // associate observables with subscriptions
    let subs = new Map<Rx.Observable<T>, Rx.Subscription>();

    // subscribe initial dependencies to subject
    let arr = setToArray<Rx.Observable<T>>(captured);
    let length = arr.length;
    let o: Rx.Observable<T>;

    for (let i = 0; i < length; i++) {
        o = arr[i];
        subs.set(o, o.publishReplay(undefined, 1).refCount().subscribe(allSeeingEye));
    }

    let obs: Rx.Observable<Rx.Observable<T>> = Rx.Observable.create((observer: Rx.Observer<Rx.Observable<T>>) => {
        let innerDisp = allSeeingEye.subscribe(trigger => {
            try {
                let capturedNew = new Set<Rx.Observable<T>>();

                // evaluate and produce next value
                result = exp(ctx.$data, locals);

                // house-keeping: let go of unused observables
                let innerArr = setToArray<Rx.Observable<T>>(captured);
                let innerLength = innerArr.length;

                for (let i = 0; i < innerLength; i++) {
                    o = innerArr[i];

                    if (!capturedNew.has(o)) {
                        let disp = subs.get(o);
                        if (disp != null) {
                            disp.unsubscribe();
                        }
                        subs.delete(o);
                    }
                }

                // add new ones
                innerArr = setToArray<Rx.Observable<T>>(capturedNew);
                innerLength = innerArr.length;

                for (let i = 0; i < innerLength; i++) {
                    o = innerArr[i];
                    captured.add(o);

                    if (!subs.has(o)) {
                        subs.set(o, o.publishReplay(undefined, 1).refCount().subscribe(allSeeingEye));
                    }
                }

                // emit new value
                if (!isRxObservable(result)) {
                    // wrap non-observable
                    observer.next(Rx.Observable.of(result));
                } else {
                    observer.next(result);
                }

            } catch (e) {
                exception.next(e);
            }
        });

        return new Rx.Subscription(() => {
            innerDisp.unsubscribe();

            // unsubscribe subscriptions
            subs.forEach((value, key, map) => {
                if (value) {
                    value.unsubscribe();
                }
            });

            // cleanup
            subs.clear();
            captured.clear();
            allSeeingEye.unsubscribe();

            locals = null;
        });
    });

    // prefix with initial result
    let startValue = isRxObservable(result) ?
        result :
        Rx.Observable.of(result);

    return obs.startWith(startValue).concatAll();
}
