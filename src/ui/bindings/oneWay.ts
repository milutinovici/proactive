import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { toggleCssClass } from "../utils";
import { SimpleBinding } from "./bindingBase";
import { exception } from "../exceptionHandlers";

export class CssBinding extends SimpleBinding<string> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected apply(el: HTMLElement, observable: Observable<string>, className: string): Subscription {
        return observable.subscribe(value => {
            if (className) {
                const classes = className.split(/\s+/).map(x => x.trim()).filter(x => x);

                if (classes.length) {
                    toggleCssClass(el, !!value, ...classes);
                }
            } else {
                exception.next(new Error(`Class name for binding is undefined on ${el.tagName}`));
            }
        });
    }
}

export class AttrBinding extends SimpleBinding<string | number | boolean> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);

        this.priority = 5;
    }

    protected apply(el: HTMLElement, observable: Observable<string|number|boolean>, attributeName: string): Subscription {
        return observable.subscribe(value => {
            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            const toRemove = (value === false) || (value === null) || (value === undefined);
            if (toRemove) {
                el.removeAttribute(attributeName);
            } else {
                el.setAttribute(attributeName, value.toString());
            }
        });
    }
}

export class StyleBinding extends SimpleBinding<string | number | boolean> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected apply(el: HTMLElement, observable: Observable<string|number|boolean>, styleName: string): Subscription {
        return observable.subscribe(value => {
            if (value === null || value === undefined || value === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                value = "";
            }

            el.style[styleName] = value;
        });
    }
}

export class TextBinding extends SimpleBinding<string> {
    public controlsDescendants = true;
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected apply(el: HTMLElement, observable: Observable<string>): Subscription {
        return observable.subscribe(value => {
            if ((value === null) || (value === undefined)) {
                value = "";
            } else if (Array.isArray(value)) {
                value = value.join(", ");
            }
            el.textContent = value;
        });
    }
}

export class HtmlBinding extends SimpleBinding<string> {
    public controlsDescendants = true;
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected apply(el: HTMLElement, observable: Observable<string>): Subscription {
        return observable.subscribe(value => {
            if ((value === null) || (value === undefined)) {
                value = "";
            }
            el.innerHTML = value;
        });
    }
}
