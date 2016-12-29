import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState, IBindingAttribute } from "../interfaces";
import { isRxObserver } from "../utils";
import { exception } from "../exceptionHandlers";

export default class EventBinding extends BindingBase<Event> {

    public priority = 0;

    constructor(domManager: DomManager) {
        super(domManager);
    }

     public applyBinding(el: Element, bindings: IBindingAttribute<Event>[], ctx: IDataContext, state: INodeState<Event>): void {
        for (const binding of bindings) {
            if (binding.parameter === undefined) {
                exception.next(new Error(`event name must be supplied for ${binding.name} binding on ${binding.tag} element`));
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
