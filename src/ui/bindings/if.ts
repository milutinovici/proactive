import * as Rx from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { IDataContext, INodeState } from "../interfaces";
import { nodeListToArray, tryCatch } from "../utils";

export class IfBinding extends SingleBindingBase<boolean> {

    public priority = 50;
    public controlsDescendants = true;
    protected inverse: boolean = false;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyBindingInternal(el: HTMLElement, observable: Rx.Observable<boolean>, ctx: IDataContext, state: INodeState<boolean>) {
        // backup inner HTML
        const template = new Array<Node>();
        // template
        while (el.firstChild) {
            template.push(el.removeChild(el.firstChild));
        }
        const visibility = observable.map(x => !!x).distinctUntilChanged();
        // subscribe
        state.cleanup.add(visibility.subscribe(tryCatch<boolean>(x => {
            this.applyValue(el, x, template, ctx);
        })));
    }

    protected applyValue(el: HTMLElement, value: boolean, template: Array<Node>, ctx: IDataContext) {
        if (value) {
            const nodes = template.map(x => x.cloneNode(true));
            for (const node of nodes) {
                el.appendChild(node);
            }
            this.domManager.applyBindingsToDescendants(ctx, el);
        } else {
            this.removeChildren(el);
        }

    }
    private removeChildren(el: HTMLElement) {
        const oldElements = nodeListToArray(el.childNodes);
        oldElements.forEach(x => {
            this.domManager.cleanNode(<HTMLElement> x);
            el.removeChild(x);
        });
    }
}

export class NotIfBinding extends IfBinding {
    constructor(domManager: DomManager) {
        super(domManager);

        this.inverse = true;
    }
}
