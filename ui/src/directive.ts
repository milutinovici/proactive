import { isObservable, Observable, Observer, of, Subscriber, Subscription } from "rxjs";
import { Evaluator } from "./evaluator";
import { exception } from "./exceptionHandlers";
import { DataFlow, IDirective, IScope } from "./interfaces";
import { isFunction, isObserver } from "./utils";

export class Directive<T = unknown> implements IDirective<T> {
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
    // this can possibly have side-effects
    public value(): T {
        if (Array.isArray(this.text)) {
            return this.text.map((txt) => this.createObservable(Evaluator.read(this.scope, txt))) as any;
        } else {
            return Evaluator.read(this.scope, this.text);
        }
    }

    private createObserver(): Observer<T> {
        const subscriber = new Subscriber<T>((x) => {
            const result: unknown = this.value();
            if (isFunction(result)) {
                return result.bind(this.scope.$data)(x);
            } else if (result != null && isObserver(result)) {
                return result.next(x);
            }
            return result;
        }, exception.next);
        return subscriber;
    }
    private createObservable(expression: unknown = this.value()): Observable<T> {
        if (expression != null && (isObservable<T>(expression) || (Array.isArray(expression) && Array.isArray(this.text)))) {
            return expression as Observable<T>;
        } else if (isFunction(expression)) {
            return of(expression.bind(this.scope.$data)());
        } else {
            return of(expression) as Observable<T>;
        }
    }
    private createBoth(): Observable<T> | Observer<T> {
        const expression: any = this.value();
        const isFunc = isFunction(expression);
        const isObs = expression != null && (isObservable(expression) || isObserver(expression));
        if (!isObs && !isFunc && !Array.isArray(this.text)) {
            const obs: any = of(expression);
            obs.next = Evaluator.write(this.scope, this.text);
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
}
