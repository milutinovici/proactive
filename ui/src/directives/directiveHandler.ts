import { Observable, Observer, Subscription } from "rxjs";
import { IDirectiveHandler, INodeState, IDirective, DataFlow, Parametricity } from "../interfaces";
import { exception } from "../exceptionHandlers";
import { isObserver } from "../utils";
/**
 * Base class for directive handlers
 * @class
 */
export abstract class BaseDirectiveHandler<T> implements IDirectiveHandler<T> {
    public readonly name: string;
    public priority = 0;
    public dataFlow = DataFlow.Out;
    public controlsDescendants = false;
    public unique = false;
    public parametricity = Parametricity.Optional;

    constructor(name: string) {
        this.name = name;
    }

    public applyDirective(node: Element, directive: IDirective<T>, state: INodeState) {
        if (directive["activated"] > 0) {
            return;
        }
        if (this.unique && state.getDirectives(this.name).length > 1) {
            exception.next(new Error(`more than 1 ${this.name} directive on element ${node}`));
            return;
        }
        if (this.parametricity === Parametricity.Forbidden && directive.parameters.length > 0) {
            exception.next(new Error(`directive "${this.name}" with expression "${directive.text}" on element ${node} can't have parameters`));
            return;
        } else if (this.parametricity === Parametricity.Required && directive.parameters.length === 0) {
            exception.next(new Error(`directive "${this.name}" with expression "${directive.text}" on element ${node} must have a parameter`));
            return;
        }
        this.applyInternal(node, directive, state);
        directive["activated"] += 1;
    }
    protected abstract applyInternal(node: Element, directive: IDirective<T>, state: INodeState): void;
}

/**
* Base class for one-way directive handlers
* @class
*/
export abstract class DirectiveHandler<T> extends BaseDirectiveHandler<T> {
    public applyInternal(node: Element, directive: IDirective<T>, state: INodeState) {
        const obs = directive.evaluate(this.dataFlow);
        if (this.dataFlow === DataFlow.In && !isObserver(obs)) {
            exception.next(new Error(`directive "${this.name}" with expression "${directive.text}" on element ${node} must be supplied with an observer or a function`));
            return;
        }
        directive.cleanup.add(this.apply(node, obs, directive.parameters));
    }
    public abstract apply(el: Element, observable: Observable<T> | Observer<T>, parameters: string[]): Subscription;
}
