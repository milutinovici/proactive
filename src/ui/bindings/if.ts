import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { IDataContext, INodeState } from "../interfaces";
import { nodeListToArray, tryCatch } from "../utils";

export class IfBinding extends BindingBase<boolean> {

    public priority = 50;
    public controlsDescendants = true;
    protected inverse: boolean = false;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyBindingInternal(el: HTMLElement, observable: Rx.Observable<boolean>, ctx: IDataContext, state: INodeState<boolean>) {
        let self = this;

        // backup inner HTML
        let template = new Array<Node>();
        // template
        while (el.firstChild) {
            template.push(el.removeChild(el.firstChild));
        }
        const visibility = observable.map(x => !!x).distinctUntilChanged();
        // subscribe
        state.cleanup.add(visibility.subscribe(tryCatch<boolean>(x => {
            self.applyValue(el, x, template, ctx);
        })));

        // release closure references to GC
        state.cleanup.add(new Rx.Subscription(() => {
            self = null;
            template = null;
        }));
    }

    protected applyValue(el: HTMLElement, value: boolean, template: Array<Node>, ctx: IDataContext) {

        if (value) {
            let nodes = template.map(x => x.cloneNode(true));
            for (let i = 0; i < template.length; i++) {
                el.appendChild(nodes[i]);
            }
            this.domManager.applyBindingsToDescendants(ctx, el);
        } else {
            this.removeChildren(el);
        }

    }
    private removeChildren(el: HTMLElement) {
        let oldElements = nodeListToArray(el.childNodes);
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
