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
        let self = this;
        // subscribe
        state.cleanup.add(observable.subscribe(tryCatch<T>(x => {
            self.applyValue(element, x, state);
        })));
        state.cleanup.add(() => {
            state = null;
        });
    }

    protected applyValue(el: HTMLElement, value: T, state: INodeState<T>): void {
        state.model = value;
        let ctx = this.domManager.getDataContext(el);

        this.domManager.cleanDescendants(el);
        this.domManager.applyBindingsToDescendants(ctx, el);
    }
}
