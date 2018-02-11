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
let knownEventTypesByEventName: Map<string> = {};
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

export function triggerEvent(element: Element, eventType: string, keyCode?: number, modifier= "") {
    if (typeof element.dispatchEvent === "function") {
        let eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
        let event: Event;

        if (eventCategory !== "KeyboardEvent") {
            event = createEvent(eventCategory);
            event.initEvent(eventType, true, true);
        } else {
            let keyEvent = createEvent(eventCategory) as KeyboardEvent;
            keyEvent.initKeyboardEvent(eventType, true, true, dom.window, "", 0, modifier, false, "");

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
export function hasAttr(element: HTMLElement, attr: string, val?: string) {
    return Array.prototype.some.call(element.attributes, (x: Attr) => x.name === attr);
}
export function hasClass(element: HTMLElement, css: string) {
    return element.className.indexOf(css) !== -1;
}

interface Map<T> {
    [key: string]: T;
}
