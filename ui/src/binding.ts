import { exception } from "./exceptionHandlers";
import { Observable, Observer, Subscriber, Subscription, Symbol } from "rxjs";
import { IDataContext, IBinding, IBindingHandler, DataFlow, INodeState } from "./interfaces";
import { isRxObservable, isRxObserver, isFunction } from "./utils";

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
    public evaluate(ctx: IDataContext, dataFlow: DataFlow): Observable<T> | Observer<T> {
        const expression: any = this.expression(ctx);
        const isFunc = isFunction(expression);
        const isObs = expression != null && (isRxObservable(expression) || isRxObserver(expression));
        if (!(dataFlow & DataFlow.In)) { // just out
            if (isObs) {
                return expression;
            } else if (isFunc) {
                return Observable.of(expression.bind(ctx.$data)());
            } else {
                return Observable.of(expression);
            }
        // } else if (!(dataFlow & DataFlow.Out)) { // just in

        } else { // twoWay
            if (!isObs && !isFunc) {
                const obs: any = Observable.of(expression);
                obs.next = this.write(ctx);
                // obs.error = exception.error;
                obs.complete = () => {};
                obs[Symbol.rxSubscriber] = () => obs;
                return obs;
            } else if (isFunc && !isObs) {
                const fn: (t: T) => void = expression.bind(ctx.$data);
                return new Subscriber<T>(fn, exception.error);
            }
            return expression;
        }
    }

    public expression(ctx: IDataContext): T | null {
        try {
            const fn = Binding.expressionCache.get(this.text);
            if (fn !== undefined) {
                return fn(ctx);
            } else {
                const readBody = this.text ? `with($context){with($data||{}){return ${this.text};}}` : "return null;";
                let read = new Function("$context", readBody) as (ctx: IDataContext) => T | null;
                Binding.expressionCache.set(this.text, read);
                return read(ctx);
            }
        } catch (e) {
            exception.next(new Error(`Binding ${this.handler.name}="${this.text}" failed. ${e.message}`));
            return null;
        }
    };

    private write(ctx: IDataContext): (value: T) => void {
        try {
            const fn = Binding.writeCache.get(this.text);
            if (fn !== undefined) {
                return fn(ctx);
            } else if (this.canWrite(this.text)) {
                const writeBody = `with($context){with($data||{}){return function(_z){ ${this.text} = _z;}}}`;
                const write = new Function("$context", writeBody);
                Binding.writeCache.set(this.text, write);
                return write(ctx) as (value: T) => void;
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
