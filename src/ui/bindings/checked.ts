import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState, IBindingAttribute } from "../interfaces";
import { DomManager } from "../domManager";
import { isRxObserver } from "../utils";
import { exception } from "../exceptionHandlers";

export default class CheckedBinding extends BindingBase<boolean> {
    public priority = 0;

    constructor(domManager: DomManager) {
        super(domManager);
        this.twoWay = true;
    }

    public applyBinding(el: HTMLInputElement, bindings: IBindingAttribute[], ctx: IDataContext, state: INodeState<boolean>): void {
        super.applyBinding(el, bindings, ctx, state);
        if (!this.isCheckboxOrRadio(el)) {
            exception.next(new Error(`checked-binding only operates on checkboxes and radio-buttons. ${el.tagName} is not supported`));
            return;
        }

        const observable = this.evaluateBinding<boolean>(bindings[0], ctx, el) as Rx.Observable<boolean>;
        state.cleanup.add(observable.subscribe(value => {
            el.checked = value;
        }));

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

    private isCheckboxOrRadio(element: HTMLInputElement): boolean {
        const tag = element.tagName.toLowerCase();
        const isCheckBox = element.type === "checkbox";
        const isRadioButton = element.type === "radio";
        return tag === "input" && (isCheckBox || isRadioButton);
    }
}
