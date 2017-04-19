import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { SimpleHandler } from "./baseHandler";
import { isTextNode } from "../utils";

export class TextBinding extends SimpleHandler<string> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.unique = true;
        this.controlsDescendants = true;
    }

    public apply(el: HTMLInputElement, observable: Observable<string>, parameter?: string): Subscription {
        const isText = isTextNode(el);
        const textExpression = isText ? parameter : "";
        const sub = observable.subscribe(value => {
            if ((value === null) || (value === undefined)) {
                value = "";
            } else if (Array.isArray(value)) {
                value = value.join(", ");
            }
            if (isText) {
                el.nodeValue = value;
            } else {
                el.textContent = value;
            }
        });
        if (isText) {
            sub.add(() => el.nodeValue = "{{" + textExpression + "}}");
        }
        return sub;
    }
}
