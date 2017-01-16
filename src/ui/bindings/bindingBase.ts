import { Observable, Observer, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { IBindingHandler, INodeState, IBindingAttribute, DataFlow } from "../interfaces";
import { exception } from "../exceptionHandlers";

/**
 * Base class for bindings that takes a single expression and applies the result to one or more target elements
 * @class
 */
export abstract class BindingBase implements IBindingHandler {
    public readonly name: string;
    public priority = 0;
    public dataFlow = DataFlow.Out;
    public controlsDescendants = false;
    protected readonly domManager: DomManager;

    constructor(name: string, domManager: DomManager) {
        this.name = name;
        this.domManager = domManager;
    }

    public abstract applyBinding(node: Element, state: INodeState): void;

}

export abstract class SingleBindingBase<T> extends BindingBase {
    public applyBinding(el: Element, state: INodeState): void {
        const bindings = state.bindings.get(this.name) as IBindingAttribute<any>[];
        if (bindings.length > 1) {
            exception.next(new Error(`more than 1 ${this.name} binding on element ${el}`));
            return;
        }
        this.applySingleBinding(el, bindings[0].evaluate(state.context, el, this.dataFlow), state, bindings[0].parameter);
    }
    protected abstract applySingleBinding(el: Element, observable: Observable<T> | Observer<T>, state: INodeState, parameter?: string): void;
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export abstract class SimpleBinding<T> extends BindingBase {

    public applyBinding(el: Element, state: INodeState): void {
        const bindings = state.bindings.get(this.name) as IBindingAttribute<any>[];
        for (const binding of bindings) {
            const observable = binding.evaluate(state.context, el, this.dataFlow) as Observable<T>;
            const subscription = this.apply(el, observable, binding.parameter);
            if (subscription !== undefined) {
                state.cleanup.add(subscription);
            }
        }
    }

    public abstract apply(el: Element, observable: Observable<T> | Observer<T>, parameter?: string): Subscription;
}
