import * as Rx from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { IDataContext, INodeState } from "../interfaces";

export class IfBinding extends SingleBindingBase<boolean> {

    public priority = 50;
    public controlsDescendants = true;
    protected inverse: boolean = false;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    protected applySingleBinding(el: HTMLElement, observable: Rx.Observable<boolean>, state: INodeState<IDataContext>) {
        // backup inner HTML
        const template = new Array<Node>();
        // template
        while (el.firstChild) {
            template.push(el.removeChild(el.firstChild));
        }
        const visibility = observable.map(x => !!x).distinctUntilChanged();
        // subscribe
        state.cleanup.add(visibility.subscribe((x => {
            this.applyValue(el, x, template, state.context);
        })));
    }

    protected applyValue(el: HTMLElement, value: boolean, template: Array<Node>, ctx: IDataContext) {
        if (value) {
            const nodes = template.map(x => x.cloneNode(true));
            this.addChildren(el, nodes);
            this.domManager.applyBindingsToDescendants(ctx, el);
        } else {
            this.removeChildren(el);
        }

    }
    private addChildren(el: HTMLElement, nodes: Node[]) {
        const fragment = document.createDocumentFragment();
        for (const node of nodes) {
            fragment.appendChild(node);
        }
        el.appendChild(fragment);
    }
    private removeChildren(element: HTMLElement) {
        while (element.firstChild) {
            this.domManager.cleanNode(<Element> element.firstChild);
            element.removeChild(element.firstChild);
        }
    }
}

export class NotIfBinding extends IfBinding {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);

        this.inverse = true;
    }
}
