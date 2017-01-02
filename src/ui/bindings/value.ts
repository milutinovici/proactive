import { Observable, Subject } from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { DomManager } from "../domManager";
import { isRxObserver } from "../utils";

export class ValueBinding extends SingleBindingBase<string|number|boolean> {
    public priority = 5;

    constructor(domManager: DomManager) {
        super(domManager);
        this.twoWay = true;
    }

    public applySingleBinding(el: HTMLInputElement, observable: Observable<string|number|boolean> | Subject<string|number|boolean>, ctx: IDataContext, state: INodeState<string|number|boolean>, event = "change") {

        const isCheckboxOrRadio = this.isCheckboxOrRadio(el as HTMLInputElement);

        state.cleanup.add(observable.subscribe(value => {
            if (isCheckboxOrRadio) {
                if (Array.isArray(value)) {
                    el.checked = value.some(x => x === el.name);
                } else {
                    el.checked = value as boolean;
                }
            } else {
                el.value = (value === null) || (value === undefined) ? "" : value.toString();
            }
        }));

        if (isRxObserver(observable)) {
            const events = isCheckboxOrRadio ? this.getCheckedEvents(el, event) : Observable.fromEvent<Event>(el, event);
            const values = isCheckboxOrRadio ? events.map(e => (e.target as HTMLInputElement).checked as any).distinctUntilChanged() :
                                               events.map(e => (e.target as HTMLInputElement).value).distinctUntilChanged();
            state.cleanup.add(values.subscribe(observable));
        }
    }

    // private array(old: string[], value: string): string[] {
    //     old.
    // }

    private getCheckedEvents(el: Element, event: string): Observable<Event> {
        return Observable.merge<Event>(Observable.fromEvent(el, "click"), Observable.fromEvent(el, event));
    }

    private isCheckboxOrRadio(element: HTMLInputElement): element is HTMLInputElement {
        const tag = element.tagName.toLowerCase();
        return tag === "input" && (element.type === "checkbox" || element.type === "radio");
    }
}
