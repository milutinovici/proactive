import { Observable, Subscription } from "rxjs";
import { SimpleHandler } from "./baseHandler";
import { isTextNode } from "../utils";

export class TextDirective extends SimpleHandler<string> {
    constructor(name: string) {
        super(name);
        this.unique = true;
        this.controlsDescendants = true;
    }

    public apply(node: Node, observable: Observable<string>, parameters: string[]): Subscription {
        const isText = isTextNode(node);
        const textExpression = isText ? parameters[0] : "";
        const sub = observable.subscribe(value => {
            if ((value === null) || (value === undefined)) {
                value = "";
            } else if (Array.isArray(value)) {
                value = value.join(", ");
            }
            if (isText) {
                node.nodeValue = value;
            } else {
                node.textContent = value;
            }
        });
        // if (isText) {
        //     sub.add(() => el.nodeValue = "{{" + textExpression + "}}");
        // }
        return sub;
    }
}
