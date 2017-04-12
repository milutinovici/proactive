import { Observable, Observer, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { IBindingHandler, INodeState, IBindingAttribute, DataFlow, Parametricity } from "../interfaces";
import { exception } from "../exceptionHandlers";

/**
 * Base class for bindings that takes a single expression and applies the result to one or more target elements
 * @class
 */
export abstract class BindingBase<T> implements IBindingHandler {
    public readonly name: string;
    protected readonly domManager: DomManager;
    public priority = 0;
    public dataFlow = DataFlow.Out;
    public controlsDescendants = false;
    public unique = false;
    public parametricity = Parametricity.Optional;

    constructor(name: string, domManager: DomManager) {
        this.name = name;
        this.domManager = domManager;
    }

    public applyBinding(node: Element, state: INodeState): Subscription {
        const bindings = state.bindings.get(this.name) as IBindingAttribute<T>[];
        if (this.unique && bindings.length > 1) {
            exception.next(new Error(`more than 1 ${this.name} binding on element ${node}`));
            return Subscription.EMPTY;
        }
        if (this.parametricity === Parametricity.Forbidden && bindings.some(x => x.parameter !== undefined)) {
            exception.next(new Error(`binding ${this.name} binding on element ${node} can't have additional parameters`));
            return Subscription.EMPTY;
        }
        if (this.parametricity === Parametricity.Required && bindings.some(x => x.parameter === undefined)) {
            exception.next(new Error(`binding ${this.name} binding on element ${node} must have a parameter`));
            return Subscription.EMPTY;
        }
        return this.applyInternal(node, state);
    }
    protected abstract applyInternal(node: Element, state: INodeState): Subscription;
}

export abstract class SingleBindingBase<T> extends BindingBase<T> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.unique = true;
    }
    public applyInternal(el: Element, state: INodeState): Subscription {
        const binding = (state.bindings.get(this.name) as any)[0] as IBindingAttribute<T>;

        return this.applySingle(el, binding.evaluate(state.context, this.dataFlow), state, binding.parameter);
    }
    protected abstract applySingle(el: Element, observable: Observable<T> | Observer<T>, state: INodeState, parameter?: string): Subscription;
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export abstract class SimpleBinding<T> extends BindingBase<T> {

    public applyInternal(el: Element, state: INodeState): Subscription {
        const bindings = state.bindings.get(this.name) as IBindingAttribute<any>[];
        const subscription = new Subscription();
        for (const binding of bindings) {
            const observable = binding.evaluate(state.context, this.dataFlow) as Observable<T>;
            subscription.add(this.apply(el, observable, binding.parameter));
        }
        return subscription;
    }

    public abstract apply(el: Element, observable: Observable<T> | Observer<T>, parameter?: string): Subscription;
}
