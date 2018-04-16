import { Observable, fromEvent, merge } from "rxjs";
import { map, filter, distinctUntilChanged } from "rxjs/operators";
import { BaseHandler } from "./baseHandler";
import { IDirective, INodeState, DataFlow } from "../interfaces";
import { isObserver, tryParse } from "../utils";

export class ValueDirective extends BaseHandler<string|number|boolean|string[]> {
    constructor(name: string) {
        super(name);
        this.priority = 30;
        this.unique = true;
        this.dataFlow = DataFlow.Out | DataFlow.In;
    }

    public applyInternal(el: HTMLElement, directive: IDirective<string | number | boolean | string[]>, state: INodeState): void {
        const observable = directive.evaluate(state.scope, this.dataFlow) as Observable<string | number | boolean | string[]>;
        const event = directive.parameters[0] || "change";
        if (ValueDirective.isCheckbox(el)) {
            directive.cleanup.add(observable.subscribe(value => ValueDirective.setChecked(el as HTMLInputElement, value as boolean)));
            if (isObserver(observable)) {
                 const events = ValueDirective.getEvents(el, event, true);
                 directive.cleanup.add(events.pipe(map(evt => evt.target ? evt.target["checked"] : null), distinctUntilChanged()).subscribe(observable));
            }
        } else if (ValueDirective.isRadio(el)) {
            directive.cleanup.add(observable.subscribe(value => ValueDirective.setRadio(el as HTMLInputElement, value as string|number|boolean)));
            if (isObserver(observable)) {
                 const events = ValueDirective.getEvents(el, event, true);
                 directive.cleanup.add(events.pipe(map(evt => evt.target ? evt.target["value"] : null), distinctUntilChanged(), map(tryParse)).subscribe(observable));
            }
        } else if (ValueDirective.isMultiSelect(el)) {
            directive.cleanup.add(observable.subscribe(value => ValueDirective.setMultiSelect(el as HTMLSelectElement, value)));
            if (isObserver(observable)) {
                const events = ValueDirective.getEvents(el, event, false);
                directive.cleanup.add(events.pipe(map(evt => {
                    const selected = (Array.from<HTMLOptionElement>(evt.target ? evt.target["options"] : []))
                        .filter(o => o.selected)
                        .map(o => tryParse(o.value || o.textContent || ""));
                    return selected;
                }))
                                                    .subscribe(observable as any));
            }
        } else {
            directive.cleanup.add(observable.subscribe(value => ValueDirective.setElementValue(el, value as string|number|boolean)));
            if (isObserver(observable)) {
                const events = ValueDirective.getEvents(el, event, false);
                directive.cleanup.add(events.pipe(map(evt => evt.target ? evt.target["value"] : "" as string), distinctUntilChanged(), map(tryParse)).subscribe(observable));
            }
        }
    }

    private static getEvents(el: Element, event: string, isCheckboxOrRadio: boolean): Observable<Event> {
        return (isCheckboxOrRadio ? merge<Event>(fromEvent(el, "click"), fromEvent(el, event)) :
        fromEvent<Event>(el, event)).pipe(filter(evt => evt.target === el));
    }
    private static isCheckbox(element: HTMLElement): element is HTMLInputElement {
        const tag = element.tagName;
        return tag === "INPUT" && element["type"] === "checkbox";
    }
    private static isRadio(element: HTMLElement): element is HTMLInputElement {
        const tag = element.tagName;
        return tag === "INPUT" && element["type"] === "radio";
    }
    private static isMultiSelect(element: HTMLElement): element is HTMLSelectElement {
        const tag = element.tagName;
        return tag === "SELECT" && element["multiple"];
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
            ValueDirective.setElementValue(el, value);
        }
    }
}
