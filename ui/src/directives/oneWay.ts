import { Observable, Subscription } from "rxjs";
import { DirectiveHandler } from "./directiveHandler";
import { Parametricity, IKeyValue } from "../interfaces";

export class CssDirective extends DirectiveHandler<boolean> {
    constructor() {
        super();
        this.parametricity = Parametricity.Required;
    }

    public apply(element: Element, observable: Observable<boolean>, parameters: string[]): Subscription {
        const className = parameters[0];
        return observable.subscribe(value => {
            if (value) {
                element.classList.add(className);
            } else {
                element.classList.remove(className);
            }
        });
    }
}

export class AttrDirective extends DirectiveHandler<string | number | boolean> {
    constructor() {
        super();
        this.parametricity = Parametricity.Required;
        this.priority = 5;
    }

    public apply(element: Element, observable: Observable<string | number | boolean>, parameters: string[]): Subscription {
        const attributeName = parameters[0];
        return observable.subscribe(value => {
            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            const toRemove = (value === false) || (value === null) || (value === undefined);
            if (toRemove) {
                element.removeAttribute(attributeName);
            } else {
                element.setAttribute(attributeName, value.toString());
            }
        });
    }
}

export class StyleDirective extends DirectiveHandler<string | number | boolean> {
    constructor() {
        super();
        this.parametricity = Parametricity.Required;
    }

    public apply(element: HTMLElement, observable: Observable<string | number | boolean>, parameters: string[]): Subscription {
        const styleName = parameters[0];
        return observable.subscribe(value => {
            if (value === null || value === undefined || value === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                value = "";
            }
            const style = element.style as IKeyValue;
            style[styleName] = value;
        });
    }
}
