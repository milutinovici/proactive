import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { SingleBindingBase } from "./bindingBase";
import { INodeState, IBindingAttribute } from "../interfaces";
import { isTextNode } from "../utils";

export class TextBinding extends SingleBindingBase<string> {

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applySingleBinding(el: HTMLInputElement, observable: Rx.Observable<string>, state: INodeState) {
        const textExpression = (state.bindings.get(this.name) as IBindingAttribute<any>[])[0].text;
        const isText = isTextNode(el);
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
        state.cleanup.add(sub);
        if (isText) {
            state.cleanup.add(() => el.nodeValue = "{{" + textExpression + "}}");
        }
    }
}
