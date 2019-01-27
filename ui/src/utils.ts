import { Observable, Observer } from "rxjs";

/**
* Determines if target is an instance of a Observer
* @param {any} target
*/
export function isObserver<T>(target: T | Observer<T> | Observable<T>): target is Observer<T> {
    const trg = target as any;
    return trg[Symbol.for("rxSubscriber")] !== undefined;
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
    return "content" in node;
}

/**
 * Try to convert a string to a number or a boolean, else return string
 */
export function tryParse(str: string): number | boolean | string {
    if (isBoolean(str)) {
        return str === "true";
    } else if (str.trim() !== "" && !isNaN(str as any)) {
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

export function removeEmptyChildren(element: Node) {
    let child = element.firstChild as Node | null;
    while (child !== null) {
        if (isTextNode(child) && (child.textContent as string).trim() === "") {
            element.removeChild(child);
        }
        child = child.nextSibling;
    }
}
