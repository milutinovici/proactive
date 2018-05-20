import { Observable, combineLatest } from "rxjs";
import {  BaseDirectiveHandler } from "./directiveHandler";
import { IDirective, INodeState } from "../interfaces";

export class TextDirective extends BaseDirectiveHandler<string> {
    constructor(name: string) {
        super(name);
        this.unique = true;
        this.controlsDescendants = true;
    }

    protected applyInternal(node: Element, directive: IDirective<string>, state: INodeState) {
        const observable = directive.evaluate(this.dataFlow) as Observable<string> | Observable<string>[];
        let subscription;
        if (Array.isArray(observable)) {
            subscription = combineLatest(observable).subscribe(values => {
                const zipped = directive.parameters.map((text, i) => {
                    let value = values[i];
                    if ((value === null) || (value === undefined)) {
                        value = "";
                    } else if (Array.isArray(value)) {
                        value = value.join(", ");
                    }
                    return text + value;
                });
                node.nodeValue = zipped.join("");
            });
        } else {
            subscription = observable.subscribe(value => {
                if ((value === null) || (value === undefined)) {
                    value = "";
                } else if (Array.isArray(value)) {
                    value = value.join(", ");
                }
                node.textContent = value;
            });
        }
        directive.cleanup.add(subscription);
    }
}
