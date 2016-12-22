import * as Rx from "rxjs";
import { isRxObservable, isRxObserver, isFunction, isElement } from "../utils";
import { DomManager } from "../domManager";
import { expressionToObservable } from "../expressionCompiler";
import { IDataContext, IBindingHandler, ICompiledExpression, IBindingAttribute, INodeState } from "../interfaces";
import { exception } from "../exceptionHandlers";

/**
 * Base class for bindings that takes a single expression and applies the result to one or more target elements
 * @class
 */
export abstract class BindingBase<T> implements IBindingHandler<T> {
    public priority = 0;
    public controlsDescendants = false;
    protected domManager: DomManager;

    constructor(domManager: DomManager) {
        this.domManager = domManager;
    }

    public applyBinding(node: Element, bindings: IBindingAttribute[], ctx: IDataContext, state: INodeState<T>): void {
        if (!isElement(node)) {
            throw Error("binding only operates on elements!");
        }
        if (bindings.some(b => b.expression == null)) {
            throw Error(`invalid binding-options on node ${node}`);
        }
    }

    protected evaluateBinding<T>(expression: ICompiledExpression<T>, ctx: IDataContext, node: Element): Rx.Observable<T> | Rx.Observer<T> {
        let obs: any = expression(ctx, node);
        if (isRxObservable(obs) || isRxObserver(obs)) {
            obs = obs;
        } else if (isFunction(obs)) {
            const fn: (t: T, e: Element, ctx: IDataContext) => void = obs.bind(ctx.$data);
            obs = new Rx.Subscriber<T>(x => fn(x, node, ctx), exception.error);
        } else {
            obs = expressionToObservable(expression, ctx, node);
            if (expression.write !== undefined) {
                obs.write = expression.write(ctx, node);
            }
        }
        return obs;
    }
}

export abstract class SingleBindingBase<T> extends BindingBase<T> {
    public applyBinding(el: Element, bindings: IBindingAttribute[], ctx: IDataContext, state: INodeState<T>): void {
        super.applyBinding(el, bindings, ctx, state);
        if (bindings.length > 1) {
            exception.next(new Error(`more than 1 single binding on element ${el}`));
            return;
        }
        this.applyBindingInternal(el, this.evaluateBinding(bindings[0].expression, ctx, el), ctx, state, bindings[0].parameter);
    }
    protected abstract applyBindingInternal(el: Element, observable: Rx.Observable<T> | Rx.Observer<T>, ctx: IDataContext, state: INodeState<T>, parameter?: string): void;
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export abstract class OneWayBindingBase<T> extends BindingBase<T> {
    constructor(domManager: DomManager) {
        super(domManager);
    }

    public applyBinding(el: Element, bindings: IBindingAttribute[], ctx: IDataContext, state: INodeState<T>): void {
        super.applyBinding(el, bindings, ctx, state);
        for (const binding of bindings) {
            const observable = this.evaluateBinding(binding.expression, ctx, el) as Rx.Observable<T>;
            const subscription = observable.subscribe((x => this.applyValue(el, x, binding.parameter)));
            state.cleanup.add(subscription);
        }
    }

    protected abstract applyValue(el: Element, value: T, parameter?: string): void;
}
