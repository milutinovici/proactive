import { Observable, Subscription } from "rxjs";
import { SimpleHandler } from "./baseHandler";
import { Parametricity } from "../interfaces";

export class CssDirective extends SimpleHandler<boolean> {
    constructor(name: string) {
        super(name);
        this.parametricity = Parametricity.Required;
    }

    public apply(el: HTMLElement, observable: Observable<boolean>, className: string): Subscription {
        return observable.subscribe(value => {
            if (value) {
                el.classList.add(className);
            } else {
                el.classList.remove(className);
            }
        });
    }
}

export class AttrDirective extends SimpleHandler<string | number | boolean> {
    constructor(name: string) {
        super(name);
        this.parametricity = Parametricity.Required;
        this.priority = 5;
    }

    public apply(el: HTMLElement, observable: Observable<string|number|boolean>, attributeName: string): Subscription {
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

export class StyleDirective extends SimpleHandler<string | number | boolean> {
    constructor(name: string) {
        super(name);
        this.parametricity = Parametricity.Required;
    }

    public apply(el: HTMLElement, observable: Observable<string|number|boolean>, styleName: string): Subscription {
        return observable.subscribe(value => {
            if (value === null || value === undefined || value === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                value = "";
            }

            el.style[styleName] = value;
        });
    }
}
