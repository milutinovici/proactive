import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { isRxObserver } from "../utils";

export default class EventBinding extends BindingBase<Event> {

    public priority = 0;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyBindingInternal(el: HTMLElement, observer: Rx.Observer<Event>, ctx: IDataContext, state: INodeState<Event>, eventName: string) {
        let events = Rx.Observable.fromEvent<Event>(el, eventName);
        let handler: any = observer;
        if (isRxObserver(handler)) {
            state.cleanup.add(events.subscribe(handler));
        } else {
            throw Error("invalid binding options");
        }
    }
}
