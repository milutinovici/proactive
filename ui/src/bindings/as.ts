import { Observable } from "rxjs";
import { BindingBase } from "./bindingBase";
import { INodeState, Parametricity, IBinding } from "../interfaces";
import { DomManager } from "../domManager";

export class AsBinding<T> extends BindingBase<T> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 50;
        this.parametricity = Parametricity.Required;
        // this.controlsDescendants = true;
    }

    public applyInternal(element: HTMLElement, binding: IBinding<T>, state: INodeState) {
        const observable = binding.evaluate(state.context, this.dataFlow) as Observable<T>;
        const name = binding.parameter as string;
        // subscribe
        binding.cleanup.add(observable.subscribe(model => {
            state.context = state.context.extend(name, model);

            this.domManager.cleanDescendants(element);
            this.domManager.applyBindingsToDescendants(state.context, element);
        }));
    }

}
