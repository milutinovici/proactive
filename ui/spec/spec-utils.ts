import { JSDOM } from "jsdom";
const dom = new JSDOM(`<!DOCTYPE html></html>`);
export const document = dom.window.document;

export function parse(template: string): Node[] {
    return Array.from(fragment(template).childNodes);
}
export function fragment(template: string): DocumentFragment {
    return JSDOM.fragment(template);
}

let knownEvents = {};
let knownEventTypesByEventName = {};
const keyEventTypeName = "KeyboardEvent";
knownEvents[keyEventTypeName] = ["keyup", "keydown", "keypress"];
knownEvents["MouseEvents"] = ["click", "dblclick", "mousedown", "mouseup", "mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave"];

Object.keys(knownEvents).forEach(x => {
    let eventType = x;
    let knownEventsForType = knownEvents[x];

    if (knownEventsForType.length) {
        for (let i = 0, j = knownEventsForType.length; i < j; i++) {
            knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    }
});
function createEvent(category: any): Event {
    return dom.window.document.createEvent(category);
}
export function triggerEvent(element: Element, eventType: string, keyCode?: any) {
    if (typeof element.dispatchEvent === "function") {
        let eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
        let event: any;

        if (eventCategory !== "KeyboardEvent") {
            event = createEvent(eventCategory);
            (<any> event.initEvent)(eventType, true, true, dom.window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
        } else {
            let keyEvent = <KeyboardEvent> <any> createEvent(eventCategory);
            keyEvent.initKeyboardEvent(eventType, true, true, dom.window, "", 0, "", false, "");

            if (keyCode) {
                Object.defineProperty(keyEvent, "keyCode", {
                    get() {
                        return keyCode;
                    },
                });
            }

            event = keyEvent;
        }

        element.dispatchEvent(event);
    } else {
        throw new Error("The supplied element doesn't support dispatchEvent");
    }
}

export function toArray(collection: HTMLCollection | NodeListOf<Element>) {
    const array: Element[] = [];
    for (let i = 0; i < collection.length; i++) {
        array.push(collection[i]);
    }
    return array;
}
export function range(start: number, end: number) {
    const array: number[] = [];
    for (let i = start; i < end; i++) {
        array.push(i);
    }
    return array;
}
