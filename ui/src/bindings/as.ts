import { Observable, Subscription } from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { INodeState, Parametricity } from "../interfaces";
import { DomManager } from "../domManager";

export class AsBinding<T> extends SingleBindingBase<T> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 50;
        this.parametricity = Parametricity.Required;
        // this.controlsDescendants = true;
    }

    public applySingle(element: HTMLElement, observable: Observable<T>, state: INodeState, name: string): Subscription {
        // subscribe
        return observable.subscribe(model => {
            state.context = state.context.extend(name, model);

            this.domManager.cleanDescendants(element);
            this.domManager.applyBindingsToDescendants(state.context, element);

        });
    }

}
