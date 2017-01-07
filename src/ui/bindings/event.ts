import { Observable, Observer, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { SimpleBinding } from "./bindingBase";
import { isRxObserver } from "../utils";
import { exception } from "../exceptionHandlers";

export class EventBinding extends SimpleBinding<KeyboardEvent> {

    public priority = 0;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public apply(el: Element, observer: Observer<KeyboardEvent>, parameter: string): Subscription|undefined {
        if (parameter === undefined) {
            exception.next(new Error(`Event name must be supplied for ${this.name} binding, on ${el.tagName} element`));
            return;
        }
        if (!isRxObserver(observer)) {
            exception.next(new Error(`Observer or function must be supplied for ${this.name} binding on ${el}`));
            return;
        }
        const events = Observable.fromEvent<Event>(el, parameter);
        return events.subscribe(observer);
    }
}
