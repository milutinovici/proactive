import { Observable, Subject, Subscription } from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { INodeState, DataFlow } from "../interfaces";
import { DomManager } from "../domManager";
import { isRxObserver, nodeListToArray, tryParse } from "../utils";

export class ValueBinding extends SingleBindingBase<string|number|boolean|string[]> {
    public priority = 5;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.dataFlow = DataFlow.Out | DataFlow.In;
    }

    public applySingleBinding(el: HTMLElement, observable: Subject<string|number|boolean|string[]>, state: INodeState, event = "change") {
        let sub1: Subscription;
        let sub2: Subscription | undefined;

        if (ValueBinding.isCheckbox(el)) {
            sub1 = observable.subscribe(value => ValueBinding.setChecked(el as HTMLInputElement, value as boolean));
            if (isRxObserver(observable)) {
                 const events = ValueBinding.getEvents(el, event, true);
                 sub2 = events.map(evt => evt.target["checked"]).distinctUntilChanged().subscribe(observable);
            }
        } else if (ValueBinding.isRadio(el)) {
            sub1 = observable.subscribe(value => ValueBinding.setRadio(el as HTMLInputElement, value as string|number|boolean));
            if (isRxObserver(observable)) {
                 const events = ValueBinding.getEvents(el, event, true);
                 sub2 = events.map(evt => evt.target["value"]).distinctUntilChanged().map(tryParse).subscribe(observable);
            }
        } else if (ValueBinding.isMultiSelect(el)) {
            sub1 = observable.subscribe(value => ValueBinding.setMultiSelect(el as HTMLSelectElement, value));
            if (isRxObserver(observable)) {
                const events = ValueBinding.getEvents(el, event, false);
                sub2 = events.map(evt => (nodeListToArray(evt.target["options"]) as HTMLOptionElement[])
                                                    .filter(o => o.selected)
                                                    .map(o => tryParse(o.value || o.textContent || "")))
                                                    .subscribe(observable as any);
            }
        } else {
            sub1 = observable.subscribe(value => ValueBinding.setElementValue(el, value as string|number|boolean));
            if (isRxObserver(observable)) {
                const events = ValueBinding.getEvents(el, event, false);
                sub2 = events.map(evt => evt.target["value"] as string).distinctUntilChanged().map(tryParse).subscribe(observable);
            }
        }
        state.cleanup.add(sub1);
        if (sub2 !== undefined) {
            state.cleanup.add(sub2);
        }
    }

    private static getEvents(el: Element, event: string, isCheckboxOrRadio: boolean): Observable<Event> {
        return isCheckboxOrRadio ? Observable.merge<Event>(Observable.fromEvent(el, "click"), Observable.fromEvent(el, event)) :
                                   Observable.fromEvent<Event>(el, event);
    }
    private static isCheckbox(element: HTMLElement): element is HTMLInputElement {
        const tag = element.tagName.toLowerCase();
        return tag === "input" && element["type"] === "checkbox";
    }
    private static isRadio(element: HTMLElement): element is HTMLInputElement {
        const tag = element.tagName.toLowerCase();
        return tag === "input" && element["type"] === "radio";
    }
    private static isMultiSelect(element: HTMLElement): element is HTMLSelectElement {
        const tag = element.tagName.toLowerCase();
        return tag === "select" && element["multiple"];
    }
    private static setElementValue(el: HTMLElement, value: string|number|boolean) {
        el["value"] = (value === null) || (value === undefined) ? "" : value.toString();
    }
    private static setChecked(el: HTMLInputElement, value: boolean|string[]) {
        if (Array.isArray(value)) {
            el.checked = value.indexOf(el.value) !== -1;
        } else {
            el.checked = value;
        }
    }
    private static setRadio(el: HTMLInputElement, value: string|number|boolean) {
        el.checked = el.value == value;
    }
    private static setMultiSelect(el: HTMLSelectElement, value: string|number|boolean|string[]) {
        if (Array.isArray(value)) {
            const options = nodeListToArray(el["options"]) as HTMLOptionElement[];
            options.forEach(x => x.selected = value.indexOf(x.value) !== -1);
        } else {
            ValueBinding.setElementValue(el, value);
        }
    }
}
