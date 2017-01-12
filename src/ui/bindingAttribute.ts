import { exception } from "./exceptionHandlers";
import { Observable, Observer, Subscriber, Symbol } from "rxjs";
import { IDataContext, IBindingAttribute } from "./interfaces";
import { isRxObservable, isRxObserver, isFunction } from "./utils";

export class BindingAttribute<T> implements IBindingAttribute<T> {
    private static expressionCache = new Map<string, Function>();
    private static writeCache = new Map<string, Function>();
    public readonly tag: string;
    public readonly name: string;
    public readonly text: string;
    public readonly parameter?: string;

    constructor(tag: string, name: string, text: string, parameter?: string) {
        this.tag = tag;
        this.name = name;
        this.text = text.trim();
        this.parameter = parameter;
    }

    public evaluate(ctx: IDataContext, element: Element, twoWay: boolean): Observable<T> | Observer<T> {
        let obs: any = this.expression(ctx);
        if (isRxObservable(obs) || isRxObserver(obs)) {
            obs = obs;
        } else if (isFunction(obs)) {
            const fn: (t: T, element: Element, ctx: IDataContext) => void = obs.bind(ctx.$data);
            obs = new Subscriber<T>(x => fn(x, element, ctx), exception.error);
        } else {
            obs = this.toObservable(ctx);
            if (twoWay) {
                obs.next = this.write(ctx);
                // obs.error = exception.error;
                obs.complete = () => {};
                obs[Symbol.rxSubscriber] = () => obs;
            }
        }
        return obs;
    }

    public expression(ctx: IDataContext): T | null {
        try {
            const fn = BindingAttribute.expressionCache.get(this.text);
            if (fn !== undefined) {
                return fn(ctx);
            } else {
                const readBody = this.text ? `with($context){with($data||{}){return ${this.text};}}` : "return null;";
                let read = new Function("$context", readBody) as (ctx: IDataContext) => T | null;
                BindingAttribute.expressionCache.set(this.text, read);
                return read(ctx);
            }
        } catch (e) {
            exception.next(new Error(`Binding expression "${this.text}" on element ${this.tag} failed. ${e.message}`));
            return null;
        }
    };

    private toObservable(ctx: IDataContext): Observable<T | null> {
        let result = this.expression(ctx);
        if (isRxObservable(result)) {
            return result;
        } else { // wrap it
            return Observable.of(result);
        }
    }

    private write(ctx: IDataContext): (value: any) => void {
        try {
            const fn = BindingAttribute.writeCache.get(this.text);
            if (fn !== undefined) {
                return fn(ctx);
            } else if (this.canWrite(this.text)) {
                const writeBody = `with($context){with($data||{}){return function(_z){ ${this.text} = _z;}}}`;
                const write = new Function("$context", writeBody);
                BindingAttribute.writeCache.set(this.text, write);
                return write(ctx) as (value: T) => void;
            } else {
            return (value: T) => {};
          }
        } catch (e) {
            exception.next(new Error(`Binding expression "${this.text}" on element ${this.tag} failed. ${e.message}`));
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
