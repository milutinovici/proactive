import { Observable, Subject } from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { DomManager } from "../domManager";
import { isRxObserver, nodeListToArray, tryParse } from "../utils";

export class ValueBinding extends SingleBindingBase<string|number|boolean|string[]> {
    public priority = 5;

    constructor(domManager: DomManager) {
        super(domManager);
        this.twoWay = true;
    }

    public applySingleBinding(el: HTMLElement, observable: Subject<string|number|boolean|string[]>, ctx: IDataContext, state: INodeState<string|number|boolean|string[]>, event = "change") {
        const isCheckboxOrRadio = ValueBinding.isCheckboxOrRadio(el);
        const isMultiSelect = ValueBinding.isMultiSelect(el);
        if (isCheckboxOrRadio) {
            state.cleanup.add(observable.subscribe(value => ValueBinding.setElementChecked(el as HTMLInputElement, value as boolean)));
        } else if (isMultiSelect) {
            state.cleanup.add(observable.subscribe(value => ValueBinding.setElementOptions(el as HTMLSelectElement, value)));
        } else {
            state.cleanup.add(observable.subscribe(value => ValueBinding.setElementValue(el, value)));
        }

        if (isRxObserver(observable)) {
            const events = ValueBinding.getEvents(el, event, isCheckboxOrRadio);
            if (isCheckboxOrRadio) {
                state.cleanup.add(events.map(evt => evt.target["checked"] as boolean).distinctUntilChanged().subscribe(observable));
            } else if (isMultiSelect) {
                state.cleanup.add(events.map(evt => (nodeListToArray(evt.target["options"]) as HTMLOptionElement[])
                                                    .filter(o => o.selected)
                                                    .map(o => o.value || o.textContent || ""))
                                                    .subscribe(observable));
            } else {
                state.cleanup.add(events.map(evt => evt.target["value"] as string).distinctUntilChanged().map(tryParse).subscribe(observable));
            }
        }
    }

    // private array(old: string[], value: string): string[] {
    //     old.
    // }

    private static getEvents(el: Element, event: string, isCheckboxOrRadio: boolean): Observable<Event> {
        return isCheckboxOrRadio ? Observable.merge<Event>(Observable.fromEvent(el, "click"), Observable.fromEvent(el, event)) :
                                   Observable.fromEvent<Event>(el, event);
    }

    private static isCheckboxOrRadio(element: HTMLElement): element is HTMLInputElement {
        const tag = element.tagName.toLowerCase();
        return tag === "input" && (element["type"] === "checkbox" || element["type"] === "radio");
    }
    private static isMultiSelect(element: HTMLElement): element is HTMLSelectElement {
        const tag = element.tagName.toLowerCase();
        return tag === "select" && element["multiple"];
    }
    private static setElementValue(el: HTMLElement, value: any) {
        el["value"] = (value === null) || (value === undefined) ? "" : value.toString();
    }
    private static setElementChecked(el: HTMLInputElement, value: any) {
        if (typeof value === "boolean") {
            el.checked = value;
        } else {
            el.checked = el.value === value;
        }
    }
    private static setElementOptions(el: HTMLSelectElement, value: any) {
        if (Array.isArray(value)) {
            const options = nodeListToArray(el["options"]) as HTMLOptionElement[];
            options.forEach(x => x.selected = value.indexOf(x.value) !== -1);
        } else {
            ValueBinding.setElementValue(el, value);
        }
    }
}
