import * as Rx from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { DomManager } from "../domManager";

export class AsBinding<T> extends SingleBindingBase<T> {

    public priority = 50;
    public controlsDescendants = true;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applySingleBinding(element: HTMLElement, observable: Rx.Observable<T>, state: INodeState<IDataContext>, name: string): void {
        // subscribe
        state.cleanup.add(observable.subscribe(model => {
            state.context = state.context.extend(name, model);

            this.domManager.cleanDescendants(element);
            this.domManager.applyBindingsToDescendants(state.context, element);

        }));
    }

}
