import { Observable, Observer, Subscription } from "rxjs";
import { DataFlow, Parametricity } from "../interfaces";
import { DomManager } from "../domManager";
import { SimpleBinding } from "./bindingBase";
import { isRxObserver } from "../utils";
import { exception } from "../exceptionHandlers";

export class EventBinding extends SimpleBinding<Event> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.dataFlow = DataFlow.In;
        this.parametricity = Parametricity.Required;
    }

    public apply(el: Element, observer: Observer<Event>, parameter: string): Subscription {
        if (parameter === undefined) {
            exception.next(new Error(`Event name must be supplied for ${this.name} binding, on ${el.tagName} element`));
            return Subscription.EMPTY;
        }
        if (!isRxObserver(observer)) {
            exception.next(new Error(`Observer or function must be supplied for ${this.name} binding on ${el}`));
            return Subscription.EMPTY;
        }
        const events = Observable.fromEvent<Event>(el, parameter);
        return events.subscribe(observer);
    }
}
