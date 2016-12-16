import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState, IBindingAttribute } from "../interfaces";
import { DomManager } from "../domManager";
import { isRxObserver, tryCatch } from "../utils";

export default class CheckedBinding extends BindingBase<boolean> {
    public priority = 0;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    public applyBinding(el: HTMLInputElement, bindings: IBindingAttribute[], ctx: IDataContext, state: INodeState<boolean>): void {
        const tag = el.tagName.toLowerCase();
        const isCheckBox = el.type === "checkbox";
        const isRadioButton = el.type === "radio";
        if (tag !== "input" || (!isCheckBox && !isRadioButton)) {
            throw Error("checked-binding only operates on checkboxes and radio-buttons");
        }

        const observable = this.evaluateBinding<boolean>(bindings[0].expression, ctx, el) as Rx.Observable<boolean>;
        state.cleanup.add(observable.subscribe(tryCatch<boolean>(value => {
            el.checked = value;
        })));

        if (isRxObserver(observable) || observable["write"] !== undefined) {
            const events = this.getCheckedEventObservables(el);
            const values = events.map(e => (<HTMLInputElement> e.target).checked).distinctUntilChanged();
            if (isRxObserver(observable)) {
                state.cleanup.add(values.subscribe(observable));
            } else {
                state.cleanup.add(values.subscribe(x => observable["write"](x)));
            }
        }
    }

    protected getCheckedEventObservables(el: HTMLInputElement): Rx.Observable<Event> {
        return Rx.Observable.merge<Event>(Rx.Observable.fromEvent(el, "click"), Rx.Observable.fromEvent(el, "change"));
    }
}
