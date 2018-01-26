import { exception } from "./exceptionHandlers";
import { Observable, Observer, Subscriber, Subscription, Symbol } from "rxjs";
import { IScope, IBinding, IBindingHandler, DataFlow, INodeState } from "./interfaces";
import { isObservable, isObserver, isFunction } from "./utils";

export class Binding<T> implements IBinding<T> {
    private static expressionCache = new Map<string, Function>();
    private static writeCache = new Map<string, Function>();
    public readonly handler: IBindingHandler;
    public readonly text: string;
    public readonly parameter?: string;
    public readonly cleanup: Subscription;
    private activated: number;

    constructor(handler: IBindingHandler, text: string, parameter?: string) {
        this.handler = handler;
        this.text = text;
        this.parameter = parameter;
        this.cleanup = new Subscription();
        this.activated = 0;
    }
    public activate(node: Node, state: INodeState) {
        if (this.activated === 0) {
            this.handler.applyBinding(node, this, state);
            this.activated += 1;
        }
    }
    public deactivate() {
        this.cleanup.unsubscribe();
        this.activated -= 1;
    }
    public clone(): Binding<T> {
        return new Binding<T>(this.handler, this.text, this.parameter);
    }
    public evaluate(scope: IScope, dataFlow: DataFlow): Observable<T> | Observer<T> {
        if (dataFlow === DataFlow.Out) {
            return this.createObservable(scope);
        } else if (dataFlow === DataFlow.In) {
            return this.createObserver(scope);
        } else { // twoWay
            return this.createBoth(scope);
        }
    }

    public expression(scope: IScope): T | null {
        try {
            const fn = Binding.expressionCache.get(this.text);
            if (fn !== undefined) {
                return fn(scope);
            } else {
                const readBody = this.text ? `with($scope){with($data||{}){return ${this.text};}}` : "return null;";
                let read = new Function("$scope", readBody) as (scope: IScope) => T | null;
                Binding.expressionCache.set(this.text, read);
                return read(scope);
            }
        } catch (e) {
            exception.next(new Error(`Binding ${this.handler.name}="${this.text}" failed. ${e.message}`));
            return null;
        }
    };
    private createObserver(scope: IScope): Observer<T> {
        const subscriber = new Subscriber<T>(x => {
            const result: any = this.expression(scope);
            if (isFunction(result)) {
                return result.bind(scope.$data)(x);
            } else if (result != null && isObserver(result)) {
                return result.next(x);
            }
            return result;
        }, exception.error);
        return subscriber;
    }
    private createObservable(scope: IScope): Observable<T> {
        const expression: any = this.expression(scope);
        if (expression != null && isObservable(expression)) {
            return expression;
        } else if (isFunction(expression)) {
            return Observable.of(expression.bind(scope.$data)());
        } else {
            return Observable.of(expression);
        }
    }
    private createBoth(scope: IScope): Observable<T> | Observer<T> {
        const expression: any = this.expression(scope);
        const isFunc = isFunction(expression);
        const isObs = expression != null && (isObservable(expression) || isObserver(expression));
        if (!isObs && !isFunc) {
            const obs: any = Observable.of(expression);
            obs.next = this.write(scope);
            // obs.error = exception.error;
            obs.complete = () => {};
            obs[Symbol.rxSubscriber] = () => obs;
            return obs;
        } else if (isFunc && !isObs) {
            const fn: (t: T) => void = expression.bind(scope.$data);
            return new Subscriber<T>(fn, exception.error);
        }
        return expression;
    }
    private write(scope: IScope): (value: T) => void {
        try {
            const fn = Binding.writeCache.get(this.text);
            if (fn !== undefined) {
                return fn(scope);
            } else if (this.canWrite(this.text)) {
                const writeBody = `with($scope){with($data||{}){return function(_z){ ${this.text} = _z;}}}`;
                const write = new Function("$scope", writeBody);
                Binding.writeCache.set(this.text, write);
                return write(scope) as (value: T) => void;
            } else {
            return (value: T) => {};
          }
        } catch (e) {
            exception.next(new Error(`Binding ${this.handler.name}="${this.text}" failed. ${e.message}`));
            return (value: T) => {};
        }
    }

    private canWrite(expression: string): boolean {
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
}
