import { Observable, Observer, Subscription } from "rxjs";
import { IBindingHandler, INodeState, IBinding, DataFlow, Parametricity } from "../interfaces";
import { exception } from "../exceptionHandlers";

/**
 * Base class for bindings that takes a single expression and applies the result to one or more target elements
 * @class
 */
export abstract class BaseHandler<T> implements IBindingHandler {
    public readonly name: string;
    public priority = 0;
    public dataFlow = DataFlow.Out;
    public controlsDescendants = false;
    public unique = false;
    public parametricity = Parametricity.Optional;

    constructor(name: string) {
        this.name = name;
    }

    public applyBinding(node: Element, binding: IBinding<T>, state: INodeState) {
        // const bindings = state.getBindings(this.name) as IBinding<T>[];
        // if (this.unique && bindings.length > 1) {
        //     exception.next(new Error(`more than 1 ${this.name} binding on element ${node}`));
        // }

        if (this.parametricity === Parametricity.Forbidden && binding.parameter !== undefined) {
            exception.next(new Error(`binding "${this.name}" with expression "${binding.text}" on element ${node} can't have parameters`));
        } else if (this.parametricity === Parametricity.Required && binding.parameter === undefined) {
            exception.next(new Error(`binding "${this.name}" with expression "${binding.text}" on element ${node} must have a parameter`));
        }
        this.applyInternal(node, binding, state);
    }
    protected abstract applyInternal(node: Element, binding: IBinding<T>, state: INodeState): void;
}

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export abstract class SimpleHandler<T> extends BaseHandler<T> {
    public applyInternal(el: Element, binding: IBinding<T>, state: INodeState) {
        const observable = binding.evaluate(state.context, this.dataFlow) as Observable<T>;
        binding.cleanup.add(this.apply(el, observable, binding.parameter));
    }
    public abstract apply(el: Element, observable: Observable<T> | Observer<T>, parameter?: string): Subscription;
}
