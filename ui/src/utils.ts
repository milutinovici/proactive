import * as Rx from "rxjs";

const regexCssClassName = /\S+/g;

/**
* Determines if target is an instance of a Rx.Observable
* @param {any} target
*/
export function isRxObservable<T>(target: T | Rx.Observable<T>): target is Rx.Observable<T> {
    return target[Rx.Symbol.observable] !== undefined;
}
/**
* Determines if target is an instance of a Rx.Observable
* @param {any} target
*/
export function isRxObserver<T>(target: T | Rx.Observer<T> | Rx.Observable<T>): target is Rx.Observer<T> {
    return target[Rx.Symbol.rxSubscriber] !== undefined;
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
export function isTextNode(target: Node): boolean {
    return target.nodeType === 3;
}
/**
* Determines if Node is an instance of a HTMLInputElement
* @param {any} target
*/
export function isInputElement(target: Node): target is HTMLInputElement {
    if (isElement(target)) {
        const tag = target.tagName.toLowerCase();
        return tag === "input" || tag === "option" || tag === "select" || tag === "textarea";
    }
    return false;
}

/**
* Determines if the specified DOM element has the specified CSS-Class
* @param {Node} node The target element
* @param {string} className The classe to check
*/
export function hasCssClass(node: HTMLElement, className: string): boolean {
    const currentClassNames: string[] = node.className.match(regexCssClassName) || [];
    return currentClassNames.indexOf(className) !== -1;
}

/**
 * Try
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

/**
 * Returns true if object is a Subscription
 * @param obj
 */
export function isSubscription(obj: any): boolean {
    return isFunction(obj.unsubscribe);
}

/**
 * Converts a NodeList into a javascript array
 * @param {NodeList} nodes
 */
export function nodeListToArray(nodes: NodeList): Node[] {
    return Array.prototype.slice.call(nodes);
}

declare function require(modules: string[], successCB: (s: any) => any, errCB: (err: Error) => any): void;

/**
* Turns an AMD-Style require call into an observable
* @param {string} Module The module to load
* @return {Rx.Observable<any>} An observable that yields a value and compconstes as soon as the module has been loaded
*/
export function observableRequire<T>(module: string): Rx.Observable<T> {
    const requireFunc = require || (window != null ? window["require"] : null);

    if (!isFunction(requireFunc)) {
        throw Error("there's no AMD-module loader available (Hint: did you forget to include RequireJS in your project?)");
    }
    return Rx.Observable.create((observer: Rx.Observer<T>) => {
        try {
            requireFunc([module], (m: T) => {
                observer.next(m);
                observer.complete();
            }, (err: Error) => {
                    observer.error(err);
                });
        } catch (e) {
            observer.error(e);
        }

        return Rx.Subscription.EMPTY;
    });
}

export function nodeIndex(node: Node) {
    return node.parentElement ? Array.prototype.indexOf.call(node.parentElement.children, node) : -1;
}

export function groupBy<T>(array: T[], selector: (x: T) => any): Map<string, T[]>  {
    const groups = new Map<string, T[]>();
    for (const element of array) {
        const key: string = selector(element).toString();
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        (groups.get(key) as T[]).push(element);
    }
    return groups;
};

export function isHandlebarExpression(expression: string | null) {
    const open = "{";
    const closed = "}";
    return expression !== null && expression.length > 4 &&
           expression[0] === open && expression[1] === open &&
           expression[expression.length - 1] === closed && expression[expression.length - 2] === closed;
}
