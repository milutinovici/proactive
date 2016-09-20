import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { INodeState, IDataContext } from "../interfaces";
import { isRxObserver, isInputElement, tryCatch } from "../utils";
import { BindingBase } from "./bindingBase";

export default class ValueBinding<T> extends BindingBase<T> {
    public priority = 5;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyBindingInternal(element: HTMLInputElement, observable: Rx.Observable<T> | Rx.Subject<T>, ctx: IDataContext, state: INodeState<T>, eventName = "change"): void {
        const tag = element.tagName.toLowerCase();
        if (!isInputElement(element)) {
            throw Error("value-binding only operates on checkboxes and radio-buttons");
        }
        const storeValueInNodeState = (tag === "input" && element.type === "radio");

        function updateElement<T>(domManager: DomManager, value: T) {
            if (storeValueInNodeState) {
                setNodeValue(element, value, domManager);
            } else {
                element.value = (value === null) || (value === undefined) ? "" : value.toString();
            }
        }

        state.cleanup.add(observable.subscribe(x => {
            updateElement(this.domManager, x);
        }));

        if (isRxObserver(observable)) {
            const events = Rx.Observable.fromEvent(element, eventName);
            state.cleanup.add(events.subscribe(tryCatch<Event>(e => {
                if (storeValueInNodeState) {
                    observable.next(getNodeValue<T>(element, this.domManager));
                } else {
                    observable.next(<any> element.value);
                }
            })));
        }
    }

}

/**
 * For certain elements such as select and input type=radio we store
 * the real element value in NodeState if it is anything other than a
 * string. This method returns that value.
 * @param {Node} node
 * @param {IDomManager} domManager
 */
export function getNodeValue<T>(node: HTMLInputElement, domManager: DomManager): T {
    const state = domManager.nodeState.get<T>(node);
    if (state != null && state[hasValueBindingValue]) {
        return state[valueBindingValue];
    }

    return <any> node.value;
}

/**
 * Associate a value with an element. Either by using its value-attribute
 * or storing it in NodeState
 * @param {Node} node
 * @param {any} value
 * @param {IDomManager} domManager
 */
export function setNodeValue<T>(node: HTMLInputElement, value: T, domManager: DomManager): void {
    if ((value === null) || (value === undefined)) {
        value = <any> "";
    }
    let state = domManager.nodeState.get<T>(node);

    if (typeof value === "string") {
        // Update the element only if the element and model are different. On some browsers, updating the value
        // will move the cursor to the end of the input, which would be bad while the user is typing.
        if (node.value !== <any> value) {
            node.value = <any> value;

            // clear state since value is stored in attribute
            if (state != null && state[hasValueBindingValue]) {
                state[hasValueBindingValue] = false;
                state[valueBindingValue] = undefined;
            }
        }
    } else {
        // get or create state
        if (state == null) {
            state = this.createNodeState();
            this.setNodeState(node, state);
        }

        // store value
        state[valueBindingValue] = value;
        state[hasValueBindingValue] = true;
    }
}

const hasValueBindingValue = "has.bindings.value";
const valueBindingValue = "bindings.value";
