import { Observable, Observer, Subscription } from "rxjs";
import { DataFlow, Parametricity } from "../interfaces";
import { SimpleHandler } from "./baseHandler";
import { exception } from "../exceptionHandlers";

export class EventBinding extends SimpleHandler<Event> {
    constructor(name: string) {
        super(name);
        this.dataFlow = DataFlow.In;
        this.parametricity = Parametricity.Required;
    }

    public apply(el: Element, observer: Observer<Event>, parameter: string): Subscription {
        const parameters = parameter.split("-");
        const selector = parameters.slice(1).join("-");
        let events = Observable.fromEvent<Event>(el, parameters[0]);
        if (selector !== "") {
            events = events.filter(x => (<Element> x.target).matches(selector));
        }
        return events.subscribe(observer);
    }

}
