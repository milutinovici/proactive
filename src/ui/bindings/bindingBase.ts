import * as Rx from "rxjs";
import { isRxObservable, isRxObserver, isFunction, isElement, tryCatch } from "../utils";
import { DomManager } from "../domManager";
import { NodeState } from "../nodeState";
import { expressionToObservable, evaluateExpression } from "../expressionCompiler";
import { IDataContext, IBindingHandler, ICompiledExpression } from "../interfaces";
import { exception } from "../exceptionHandlers";

/**
 * Base class for bindings that takes a single expression and applies the result to one or more target elements
 * @class
 */
export class BindingBase<T> implements IBindingHandler<T> {
    public priority = 0;
    public controlsDescendants = false;
    protected domManager: DomManager;

    constructor(domManager: DomManager) {
        this.domManager = domManager;
    }

    public applyBinding(node: HTMLElement, expression: ICompiledExpression<T>, ctx: IDataContext, state: NodeState<T>, parameter?: string): void {
        if (!isElement(node)) {
            throw Error("binding only operates on elements!");
        }
        if (expression == null) {
            throw Error("invalid binding-options!");
        }
        let obs: any = evaluateExpression(expression, ctx, node);
        if (isRxObservable(obs) || isRxObserver(obs)) {
            obs = obs;
        } else if (isFunction(obs)) {
            const fn: (t: T, e: HTMLElement, ctx: IDataContext) => void = obs.bind(ctx.$data);
            obs = new Rx.Subscriber<T>(x => fn(x, node, ctx), exception.error);
        } else {
            obs = expressionToObservable(expression, ctx);
            if (expression.write !== undefined) {
                obs.write = expression.write(ctx, node);
            }
        }

        this.applyBindingInternal(node, obs, ctx, state, parameter);
    }

    protected applyBindingInternal(el: HTMLElement, obs: Rx.Observable<T> | Rx.Observer<T>, ctx: IDataContext, state: NodeState<T>, parameter?: string): void {
        throw Error("you need to override this method!");
    }
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export class OneWayBindingBase<T> extends BindingBase<T> {
    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyBindingInternal(el: HTMLElement, observable: Rx.Observable<T>, ctx: IDataContext, state: NodeState<T>, parameter: string): void {
        state.cleanup.add(observable.subscribe(tryCatch<T>(x => {
            this.applyValue(el, x, parameter);
        })));
    }

    protected applyValue(el: HTMLElement, value: T, parameter?: string): void {
        throw Error("you need to override this method!");
    }
}
