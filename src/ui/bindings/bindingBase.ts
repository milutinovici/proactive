import { Observable, Observer } from "rxjs";
import { isElement } from "../utils";
import { DomManager } from "../domManager";
import { IDataContext, IBindingHandler, IBindingAttribute, INodeState } from "../interfaces";
import { exception } from "../exceptionHandlers";

/**
 * Base class for bindings that takes a single expression and applies the result to one or more target elements
 * @class
 */
export abstract class BindingBase<T> implements IBindingHandler<T> {
    public priority = 0;
    public twoWay = false;
    public controlsDescendants = false;
    protected readonly domManager: DomManager;

    constructor(domManager: DomManager) {
        this.domManager = domManager;
    }

    public applyBinding(node: Element, bindings: IBindingAttribute<T>[], ctx: IDataContext, state: INodeState<T>): void {
        if (!isElement(node)) {
            throw Error("binding only operates on elements!");
        }
        if (bindings.some(b => b.expression == null)) {
            throw Error(`invalid binding-options on node ${node}`);
        }
    }

}

export abstract class SingleBindingBase<T> extends BindingBase<T> {
    public applyBinding(el: Element, bindings: IBindingAttribute<T>[], ctx: IDataContext, state: INodeState<T>): void {
        super.applyBinding(el, bindings, ctx, state);
        if (bindings.length > 1) {
            exception.next(new Error(`more than 1 single binding on element ${el}`));
            return;
        }
        this.applyBindingInternal(el, bindings[0].evaluate(ctx, el, this.twoWay), ctx, state, bindings[0].parameter);
    }
    protected abstract applyBindingInternal(el: Element, observable: Observable<T> | Observer<T>, ctx: IDataContext, state: INodeState<T>, parameter?: string): void;
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export abstract class OneWayBindingBase<T> extends BindingBase<T> {
    constructor(domManager: DomManager) {
        super(domManager);
    }

    public applyBinding(el: Element, bindings: IBindingAttribute<T>[], ctx: IDataContext, state: INodeState<T>): void {
        super.applyBinding(el, bindings, ctx, state);
        for (const binding of bindings) {
            const observable = binding.evaluate(ctx, el, this.twoWay) as Observable<T>;
            const subscription = observable.subscribe((x => this.applyValue(el, x, binding.parameter)));
            state.cleanup.add(subscription);
        }
    }

    protected abstract applyValue(el: Element, value: T, parameter?: string): void;
}
