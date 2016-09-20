import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { tryCatch } from "../utils";
import { DomManager } from "../domManager";

export default class WithBinding<T> extends BindingBase<T> {

    public priority = 50;
    public controlsDescendants = true;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    public applyBindingInternal(element: HTMLElement, observable: Rx.Observable<T>, ctx: IDataContext, state: INodeState<T>): void {
        // subscribe
        state.cleanup.add(observable.subscribe(tryCatch<T>(x => {
            this.applyValue(element, x, state);
        })));
    }

    protected applyValue(el: HTMLElement, value: T, state: INodeState<T>): void {
        state.model = value;
        const ctx = this.domManager.getDataContext(el);

        this.domManager.cleanDescendants(el);
        this.domManager.applyBindingsToDescendants(ctx, el);
    }
}
