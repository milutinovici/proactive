import { Observable, Observer, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { IDataContext, IBindingHandler, INodeState } from "../interfaces";
import { exception } from "../exceptionHandlers";

/**
 * Base class for bindings that takes a single expression and applies the result to one or more target elements
 * @class
 */
export abstract class BindingBase implements IBindingHandler {
    public readonly name: string;
    public priority = 0;
    public twoWay = false;
    public controlsDescendants = false;
    protected readonly domManager: DomManager;

    constructor(name: string, domManager: DomManager) {
        this.name = name;
        this.domManager = domManager;
    }

    public abstract applyBinding(node: Element, state: INodeState<IDataContext>): void;

}

export abstract class SingleBindingBase<T> extends BindingBase {
    public applyBinding(el: Element, state: INodeState<IDataContext>): void {
        if (state.bindings[this.name].length > 1) {
            exception.next(new Error(`more than 1 ${this.name} binding on element ${el}`));
            return;
        }
        this.applySingleBinding(el, state.bindings[this.name][0].evaluate(state.context, el, this.twoWay), state, state.bindings[this.name][0].parameter);
    }
    protected abstract applySingleBinding(el: Element, observable: Observable<T> | Observer<T>, state: INodeState<IDataContext>, parameter?: string): void;
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export abstract class SimpleBinding<T> extends BindingBase {

    public applyBinding(el: Element, state: INodeState<IDataContext>): void {
        for (const binding of state.bindings[this.name]) {
            const observable = binding.evaluate(state.context, el, this.twoWay) as Observable<T>;
            const subscription = this.apply(el, observable, binding.parameter);
            if (subscription !== undefined) {
                state.cleanup.add(subscription);
            }
        }
    }

    public abstract apply(el: Element, observable: Observable<T> | Observer<T>, parameter?: string): Subscription|undefined;
}
