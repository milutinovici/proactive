import { DomManager } from "../domManager";
import { INodeState } from "../interfaces";
import { toggleCssClass } from "../utils";
import { OneWayBindingBase } from "./bindingBase";

// Binding contributions to node-state
interface ICssNodeState extends INodeState<string> {
    cssBindingPreviousDynamicClasses: string[];
}

export class CssBinding extends OneWayBindingBase<string> {
    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyValue(el: HTMLElement, value: string, className: string): void {
        if (className) {
            const classes = className.split(/\s+/).map(x => x.trim()).filter(x => x);

            if (classes.length) {
                toggleCssClass(el, !!value, ...classes);
            }
        } else {
            throw new Error("Class name undefined");
        }
    }
}

export class AttrBinding extends OneWayBindingBase<string | number | boolean> {
    constructor(domManager: DomManager) {
        super(domManager);

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
    constructor(domManager: DomManager) {
        super(domManager);
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
    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyValue(el: HTMLElement, value: string): void {
        if ((value === null) || (value === undefined)) {
            value = "";
        }
        el.textContent = value;
    }
}

export class HtmlBinding extends OneWayBindingBase<string> {
    public controlsDescendants = true;
    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyValue(el: HTMLElement, value: string): void {
        if ((value === null) || (value === undefined)) {
            value = "";
        }
        el.innerHTML = value;
    }
}
