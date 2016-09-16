import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { DomManager } from "../domManager";
import { isRxObserver, tryCatch } from "../utils";

export default class CheckedBinding extends BindingBase<boolean> {
    public priority = 0;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    public applyBindingInternal(el: HTMLInputElement, observable: Rx.Observable<boolean> | Rx.Subject<boolean>, ctx: IDataContext, state: INodeState<boolean>): void {
        let tag = el.tagName.toLowerCase();
        let isCheckBox = el.type === "checkbox";
        let isRadioButton = el.type === "radio";

        if (tag !== "input" || (!isCheckBox && !isRadioButton)) {
            throw Error("checked-binding only operates on checkboxes and radio-buttons");
        }
        state.cleanup.add(observable.subscribe(tryCatch<boolean>(value => {
            el.checked = value;
        })));

        if (isRxObserver(observable)) {
            const events = this.getCheckedEventObservables(el);
            const values = events.map(e => (<HTMLInputElement> e.target).checked).distinctUntilChanged();
            state.cleanup.add(values.subscribe(observable));
        }
    }

    protected getCheckedEventObservables(el: HTMLInputElement): Rx.Observable<Event> {
        return Rx.Observable.merge<Event>(Rx.Observable.fromEvent(el, "click"), Rx.Observable.fromEvent(el, "change"));
    }
}
