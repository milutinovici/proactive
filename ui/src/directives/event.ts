import { Observer, Subscription, fromEvent } from "rxjs";
import { filter } from "rxjs/operators";
import { DataFlow, Parametricity } from "../interfaces";
import { SimpleHandler } from "./baseHandler";

export class EventDirective extends SimpleHandler<Event> {
    constructor(name: string) {
        super(name);
        this.dataFlow = DataFlow.In;
        this.parametricity = Parametricity.Required;
    }

    public apply(element: Element, observer: Observer<Event>, parameters: string[]): Subscription {
        const selector = parameters.slice(1).join(".");
        let events = fromEvent<Event>(element, parameters[0]);
        if (selector !== "") {
            events = events.pipe(filter(x => {
                const el = x.target as Element;
                return el.matches(selector);
            }));
        }
        return events.subscribe(observer);
    }

}
