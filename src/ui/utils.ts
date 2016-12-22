import * as Rx from "rxjs";

const regexCssClassName = /\S+/g;

/**
* Unsubscribes all subscrition members of an object
* @param {any} target
*/
export function unsubscribeMembers(target: any): void {
    Object.keys(target).filter(propertyName => {
        const disp = target[propertyName];
        return disp != null && isFunction(disp.unsubscribe);
    })
    .map(propertyName => target[propertyName])
    .forEach(disp => disp.unsubscribe());
}
/**
* Extracts the values of a Set by invoking its forEach method and capturing the output
*/
export function setToArray<T>(src: any): Array<T> {
    const result = new Array<T>();
    src.forEach((x: T) => result.push(x));
    return result;
}
/**
* Determines if target is an instance of a Rx.Observable
* @param {any} target
*/
export function isRxObservable<T>(target: T | Rx.Observable<T>): target is Rx.Observable<T> {
    if (target == null) {
        return false;
    }
    return target[Rx.Symbol.observable] !== undefined;
}
/**
* Determines if target is an instance of a Rx.Observable
* @param {any} target
*/
export function isRxObserver<T>(target: T | Rx.Observer<T> | Rx.Observable<T>): target is Rx.Observer<T> {
    if (target == null) {
        return false;
    }
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
* Toggles one ore more css classes on the specified DOM element
* @param {Node} node The target element
* @param {boolean} shouldHaveClass True if the classes should be added to the element, false if they should be removed
* @param {string[]} classNames The list of classes to process
*/
export function toggleCssClass(node: Element, shouldHaveClass: boolean, ...classNames: string[]): void {
    if (classNames) {
        const currentClassNames: string[] = node.className.match(regexCssClassName) || [];
        let index: number;

        if (shouldHaveClass) {
            for (const className of classNames) {
                index = currentClassNames.indexOf(className);
                if (index === -1) {
                    currentClassNames.push(className);
                }
            }
        } else {
            for (const className of classNames) {
                index = currentClassNames.indexOf(className);
                if (index !== -1) {
                    currentClassNames.splice(index, 1);
                }
            }
        }
        node.className = currentClassNames.join(" ");
    }
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
 * Returns true if the specified element may be disabled
 * @param {HTMLElement} el
 */
export function elementCanBeDisabled(el: Element): boolean {
    return el instanceof HTMLButtonElement ||
        el instanceof HTMLAnchorElement ||
        el instanceof HTMLInputElement ||
        el instanceof HTMLFieldSetElement ||
        el instanceof HTMLLinkElement ||
        el instanceof HTMLOptGroupElement ||
        el instanceof HTMLOptionElement ||
        el instanceof HTMLSelectElement ||
        el instanceof HTMLTextAreaElement;
}
/**
 * Returns true if object is a Function.
 * @param obj
 */
export function isFunction(obj: any): obj is Function {
    return typeof obj === "function";
}
/**
 * Returns true if param is an object.
 * @param obj
 */
export function isObject(obj: any): obj is Object {
    return typeof obj === "object";
}
/**
 * Returns true if object is a Disposable
 * @param obj
 */
export function isDisposable(obj: any): obj is Rx.Subscription {
    return isFunction(obj["unsubscribe"]);
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

export type Group<T> = { [name: string]: T[] };

export function groupBy<T>(array: T[], selector: (x: T) => any): Group<T>  {
    const groups: Group<T> = { };
    for (const element of array) {
        const key: string = selector(element).toString();
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(element);
    }
    return groups;
};
