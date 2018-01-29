import { Observable } from "rxjs";
import { map, filter, distinctUntilChanged } from "rxjs/operators";
import { BaseHandler } from "./baseHandler";
import { IBinding, INodeState, DataFlow } from "../interfaces";
import { isObserver, tryParse } from "../utils";

export class ValueBinding extends BaseHandler<string|number|boolean|string[]> {
    constructor(name: string) {
        super(name);
        this.priority = 30;
        this.unique = true;
        this.dataFlow = DataFlow.Out | DataFlow.In;
    }

    public applyInternal(el: HTMLElement, binding: IBinding<string | number | boolean | string[]>, state: INodeState): void {
        const observable = binding.evaluate(state.scope, this.dataFlow) as Observable<string | number | boolean | string[]>;
        const event = binding.parameters[0] || "change";
        if (ValueBinding.isCheckbox(el)) {
            binding.cleanup.add(observable.subscribe(value => ValueBinding.setChecked(el as HTMLInputElement, value as boolean)));
            if (isObserver(observable)) {
                 const events = ValueBinding.getEvents(el, event, true);
                 binding.cleanup.add(events.pipe(map(evt => evt.target["checked"]), distinctUntilChanged()).subscribe(observable));
            }
        } else if (ValueBinding.isRadio(el)) {
            binding.cleanup.add(observable.subscribe(value => ValueBinding.setRadio(el as HTMLInputElement, value as string|number|boolean)));
            if (isObserver(observable)) {
                 const events = ValueBinding.getEvents(el, event, true);
                 binding.cleanup.add(events.pipe(map(evt => evt.target["value"]), distinctUntilChanged(), map(tryParse)).subscribe(observable));
            }
        } else if (ValueBinding.isMultiSelect(el)) {
            binding.cleanup.add(observable.subscribe(value => ValueBinding.setMultiSelect(el as HTMLSelectElement, value)));
            if (isObserver(observable)) {
                const events = ValueBinding.getEvents(el, event, false);
                binding.cleanup.add(events.pipe(map(evt => (Array.from<HTMLOptionElement>(evt.target["options"]))
                                                    .filter(o => o.selected)
                                                    .map(o => tryParse(o.value || o.textContent || ""))))
                                                    .subscribe(observable as any));
            }
        } else {
            binding.cleanup.add(observable.subscribe(value => ValueBinding.setElementValue(el, value as string|number|boolean)));
            if (isObserver(observable)) {
                const events = ValueBinding.getEvents(el, event, false);
                binding.cleanup.add(events.pipe(map(evt => evt.target["value"] as string), distinctUntilChanged(), map(tryParse)).subscribe(observable));
            }
        }
    }

    private static getEvents(el: Element, event: string, isCheckboxOrRadio: boolean): Observable<Event> {
        return (isCheckboxOrRadio ? Observable.merge<Event>(Observable.fromEvent(el, "click"), Observable.fromEvent(el, event)) :
        Observable.fromEvent<Event>(el, event)).pipe(filter(evt => evt.target === el));
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
            const stringy = value.map(x => x.toString());
            const options = Array.from<HTMLOptionElement>(el["options"]);
            options.forEach(x => x.selected = stringy.indexOf(x.value) !== -1);
        } else {
            ValueBinding.setElementValue(el, value);
        }
    }
}
