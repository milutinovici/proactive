import * as Rx from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { DomManager } from "../domManager";

export class WithBinding<T> extends SingleBindingBase<T> {

    public priority = 50;
    public controlsDescendants = true;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applySingleBinding(element: HTMLElement, observable: Rx.Observable<T>, state: INodeState, ctx: IDataContext): void {
        // subscribe
        state.cleanup.add(observable.subscribe(x => {
            this.applyValue(element, x, state);
        }));
    }

    protected applyValue(el: HTMLElement, value: T, state: INodeState): void {
        state.model = value;
        const ctx = this.domManager.nodeState.getDataContext(el);

        this.domManager.cleanDescendants(el);
        this.domManager.applyBindingsToDescendants(ctx, el);
    }
}
