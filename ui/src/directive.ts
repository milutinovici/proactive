import { exception } from "./exceptionHandlers";
import { Observable, Observer, Subscriber, Subscription, of, isObservable } from "rxjs";
import { IScope, IDirective, DataFlow } from "./interfaces";
import { isObserver, isFunction } from "./utils";

export class Directive<T> implements IDirective<T> {
    private static expressionCache = new Map<string, Function>();
    private static writeCache = new Map<string, Function>();
    public readonly scope: IScope;
    public readonly name: string;
    public readonly text: string | string[];
    public readonly parameters: string[];
    public readonly cleanup: Subscription;
    private activated: number = 0;

    constructor(scope: IScope, name: string, text: string | string[], parameters: string[]) {
        this.name = name;
        this.scope = scope;
        this.text = text;
        this.parameters = parameters;
        this.cleanup = new Subscription();
    }

    public clone(scope: IScope): Directive<T> {
        return new Directive<T>(scope, this.name, this.text, this.parameters);
    }
    public evaluate(dataFlow: DataFlow): Observable<T> | Observer<T> {
        if (dataFlow === DataFlow.Out) {
            return this.createObservable();
        } else if (dataFlow === DataFlow.In) {
            return this.createObserver();
        } else { // twoWay
            return this.createBoth();
        }
    }

    public expression(): T | null {
        if (Array.isArray(this.text)) {
            return this.text.map(txt => this.createObservable(this.singleExpression(txt))) as any;
        } else {
            return this.singleExpression(this.text);
        }
    };
    private singleExpression(text: string): T | null {
        try {
            const fn = Directive.expressionCache.get(text);
            if (fn !== undefined) {
                return fn(this.scope);
            } else {
                const readBody = text ? `with($scope){with($data||{}){return ${text};}}` : "return null;";
                let read = new Function("$scope", readBody) as (scope: IScope) => T | null;
                Directive.expressionCache.set(text, read);
                return read(this.scope);
            }
        } catch (e) {
            exception.next(new Error(`directive ${this.name}="${text}" failed. ${e.message}`));
            return null;
        }
    }
    private createObserver(): Observer<T> {
        const subscriber = new Subscriber<T>(x => {
            const result: any = this.expression();
            if (isFunction(result)) {
                return result.bind(this.scope.$data)(x);
            } else if (result != null && isObserver(result)) {
                return result.next(x);
            }
            return result;
        }, exception.next);
        return subscriber;
    }
    private createObservable(expression: any = this.expression()): Observable<T> {
        if (expression != null && (isObservable<T>(expression) || (Array.isArray(expression) && Array.isArray(this.text)))) {
            return expression as any;
        } else if (isFunction(expression)) {
            return of(expression.bind(this.scope.$data)());
        } else {
            return of(expression);
        }
    }
    private createBoth(): Observable<T> | Observer<T> {
        const expression: any = this.expression();
        const isFunc = isFunction(expression);
        const isObs = expression != null && (isObservable(expression) || isObserver(expression));
        if (!isObs && !isFunc && !Array.isArray(this.text)) {
            const obs: any = of(expression);
            obs.next = this.write(this.text);
            // obs.error = exception.error;
            obs.complete = () => {};
            obs[Symbol.for("rxSubscriber")] = () => obs;
            return obs;
        } else if (isFunc && !isObs) {
            const fn: (t: T) => void = expression.bind(this.scope.$data);
            return new Subscriber<T>(fn, exception.error);
        }
        return expression;
    }
    private write(text: string): (value: T) => void {
        try {
            const fn = Directive.writeCache.get(text);
            if (fn !== undefined) {
                return fn(this.scope);
            } else if (this.canWrite(text)) {
                const writeBody = `with($scope){with($data||{}){return function(_z){ ${this.text} = _z;}}}`;
                const write = new Function("$scope", writeBody);
                Directive.writeCache.set(text, write);
                return write(this.scope) as (value: T) => void;
            } else {
            return (value: T) => {};
          }
        } catch (e) {
            exception.next(new Error(`directive ${this.name}="${this.text}" failed. ${e.message}`));
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
