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

     public applyBinding(el: Element, bindings: IBindingAttribute[], ctx: IDataContext, state: INodeState<KeyboardEvent>): void {
        for (const binding of bindings) {
            if (binding.parameter === undefined) {
                exception.next(new Error(`event name must be supplied for ${binding.name} binding on ${el}`));
                continue;
            }
            const observer = this.evaluateBinding(binding.expression, ctx, el);
            const events = Rx.Observable.fromEvent<Event>(el, binding.parameter);
            if (isRxObserver(observer)) {
                state.cleanup.add(events.subscribe(observer));
            } else {
                exception.next(new Error(`observer or function must be supplied for ${binding.name} binding on ${el}`));
            }
        }
    }
}
