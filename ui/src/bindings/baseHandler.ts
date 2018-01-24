import { Observable, Observer, Subscription } from "rxjs";
import { IBindingHandler, INodeState, IBinding, DataFlow, Parametricity } from "../interfaces";
import { exception } from "../exceptionHandlers";
import { isObserver } from "../utils";
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
        if (this.unique && state.getBindings(this.name).length > 1) {
            exception.next(new Error(`more than 1 ${this.name} binding on element ${node}`));
            return;
        }
        if (this.parametricity === Parametricity.Forbidden && binding.parameter !== undefined) {
            exception.next(new Error(`binding "${this.name}" with expression "${binding.text}" on element ${node} can't have parameters`));
            return;
        } else if (this.parametricity === Parametricity.Required && binding.parameter === undefined) {
            exception.next(new Error(`binding "${this.name}" with expression "${binding.text}" on element ${node} must have a parameter`));
            return;
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
    public applyInternal(node: Element, binding: IBinding<T>, state: INodeState) {
        const obs = binding.evaluate(state.context, this.dataFlow);
        if (this.dataFlow === DataFlow.In && !isObserver(obs)) {
            exception.next(new Error(`binding "${this.name}" with expression "${binding.text}" on element ${node} must be supplied with an observer or a function`));
            return;
        }
        binding.cleanup.add(this.apply(node, obs, binding.parameter));
    }
    public abstract apply(el: Element, observable: Observable<T> | Observer<T>, parameter?: string): Subscription;
}
