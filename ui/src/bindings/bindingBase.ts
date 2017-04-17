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

    public applyBinding(node: Element, state: INodeState) {
        const bindings = state.bindings.get(this.name) as IBindingAttribute<T>[];
        if (this.unique && bindings.length > 1) {
            exception.next(new Error(`more than 1 ${this.name} binding on element ${node}`));
        }
        let badBindings = bindings.filter(x => x.parameter !== undefined);
        if (this.parametricity === Parametricity.Forbidden && badBindings.length > 0) {
            badBindings.forEach(binding => exception.next(new Error(`binding ${this.name} with expression "${binding.text}" on element ${node} can't have parameters`)));
        }
        badBindings = bindings.filter(x => x.parameter === undefined);
        if (this.parametricity === Parametricity.Required && badBindings.length > 0) {
            badBindings.forEach(binding => exception.next(new Error(`binding ${this.name} with expression "${binding.text}" on element ${node} must have a parameter`)));
        }
        this.applyInternal(node, state);
    }
    protected abstract applyInternal(node: Element, state: INodeState): void;
}

export abstract class SingleBindingBase<T> extends BindingBase<T> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.unique = true;
    }
    public applyInternal(el: Element, state: INodeState) {
        const binding = (state.bindings.get(this.name) as any)[0] as IBindingAttribute<T>;
        this.applySingle(el, binding, state);
    }
    protected abstract applySingle(el: Element, binding: IBindingAttribute<T>, state: INodeState): void;
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export abstract class SimpleBinding<T> extends BindingBase<T> {
    public applyInternal(el: Element, state: INodeState) {
        const bindings = state.bindings.get(this.name) as IBindingAttribute<any>[];

        for (const binding of bindings) {
            const observable = binding.evaluate(state.context, this.dataFlow) as Observable<T>;
            binding.cleanup.add(this.apply(el, observable, binding.parameter));
        }
    }
    public abstract apply(el: Element, observable: Observable<T> | Observer<T>, parameter?: string): Subscription;
}
