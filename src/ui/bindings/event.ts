import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { isRxObserver } from "../utils";
import { exception } from "../exceptionHandlers";

export class EventBinding extends BindingBase<Event> {

    public priority = 0;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applyBinding(el: Element, state: INodeState<Event>, ctx: IDataContext): void {
        for (const binding of state.bindings[this.name]) {
            if (binding.parameter === undefined) {
                exception.next(new Error(`Event name must be supplied for ${binding.name} binding, with "${binding.text}" on ${binding.tag} element`));
                continue;
            }
            const observer = binding.evaluate(ctx, el, this.twoWay);
            const events = Rx.Observable.fromEvent<Event>(el, binding.parameter);
            if (isRxObserver(observer)) {
                state.cleanup.add(events.subscribe(observer));
            } else {
                exception.next(new Error(`Observer or function must be supplied for ${binding.name} binding on ${el}`));
            }
        }
    }
}
