import { DomManager } from "../domManager";
import { toggleCssClass } from "../utils";
import { OneWayBindingBase } from "./bindingBase";
import { exception } from "../exceptionHandlers";

export class CssBinding extends OneWayBindingBase<string> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected applyValue(el: HTMLElement, value: string, className: string): void {
        if (className) {
            const classes = className.split(/\s+/).map(x => x.trim()).filter(x => x);

            if (classes.length) {
                toggleCssClass(el, !!value, ...classes);
            }
        } else {
            exception.next(new Error(`Class name for binding is undefined on ${el.tagName}`));
        }
    }
}

export class AttrBinding extends OneWayBindingBase<string | number | boolean> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);

        this.priority = 5;
    }

    protected applyValue(el: HTMLElement, value: string | number | boolean, attributeName: string): void {
        // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
        // when someProp is a "no value"-like value (strictly null, false, or undefined)
        // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
        const toRemove = (value === false) || (value === null) || (value === undefined);
        if (toRemove) {
            el.removeAttribute(attributeName);
        } else {
            el.setAttribute(attributeName, value.toString());
        }
    }
}

export class StyleBinding extends OneWayBindingBase<string | number | boolean> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected applyValue(el: HTMLElement, value: string | number | boolean, styleName: string): void {
        if (value === null || value === undefined || value === false) {
            // Empty string removes the value, whereas null/undefined have no effect
            value = "";
        }

        el.style[styleName] = value;
    }
}

export class TextBinding extends OneWayBindingBase<string> {
    public controlsDescendants = true;
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected applyValue(el: HTMLElement, value: string): void {
        if ((value === null) || (value === undefined)) {
            value = "";
        } else if (Array.isArray(value)) {
            value = value.join(", ");
        }
        el.textContent = value;
    }
}

export class HtmlBinding extends OneWayBindingBase<string> {
    public controlsDescendants = true;
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected applyValue(el: HTMLElement, value: string): void {
        if ((value === null) || (value === undefined)) {
            value = "";
        }
        el.innerHTML = value;
    }
}
