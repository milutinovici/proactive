import { Observable, Observer, Symbol } from "rxjs";

/**
* Determines if target is an instance of a Observable
* @param {any} target
*/
export function isObservable<T>(target: T | Observable<T>): target is Observable<T> {
    return target[Symbol.observable] !== undefined;
}
/**
* Determines if target is an instance of a Observable
* @param {any} target
*/
export function isObserver<T>(target: T | Observer<T> | Observable<T>): target is Observer<T> {
    return target[Symbol.rxSubscriber] !== undefined;
}
/**
* Determines if Node is an instance of a Element
* @param {any} target
*/
export function isElement(target: Node): target is Element {
    return target.nodeType === 1;
}
/**
* Determines if Node is an instance of a Element
* @param {any} target
*/
export function isTextNode(target: Node): target is Text {
    return target.nodeType === 3;
}
export function isTemplate(node: Node): node is HTMLTemplateElement {
    return node["content"] !== undefined;
}

/**
 * Try to convert a string to a number or a boolean, else return string
 */
export function tryParse(str: string): number | boolean | string {
    if (isBoolean(str)) {
        return str === "true";
    } else if (str !== "" && !isNaN(str as any)) {
        return parseFloat(str);
    }
    return str;
}

/**
 * Returns true if string is a boolean value.
 * @param obj
 */
export function isBoolean(str: string): boolean {
    return str === "true" || str === "false";
}

/**
 * Returns true if object is a Function.
 * @param obj
 */
export function isFunction(obj: any): obj is Function {
    return typeof obj === "function";
}

export function isHandlebarExpression(expression: string | null) {
    if (expression === null || expression.length < 4) {
        return false;
    }
    const trimmed = expression.trim();
    const open = "{";
    const closed = "}";
    return trimmed[0] === open && trimmed[1] === open &&
           trimmed[trimmed.length - 1] === closed && trimmed[trimmed.length - 2] === closed;
}

export function removeEmptyChildren(element: Node) {
    let child = element.firstChild;
    while (child !== null) {
        if (isTextNode(child) && (child.textContent as string).trim() === "") {
            element.removeChild(child);
        }
        child = child.nextSibling;
    }
}
