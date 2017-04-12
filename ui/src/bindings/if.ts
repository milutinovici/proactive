import { Observable, Subscription } from "rxjs";
import { SingleBindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { INodeState, Parametricity } from "../interfaces";

export class IfBinding extends SingleBindingBase<boolean> {
    protected inverse: boolean = false;
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 50;
        this.parametricity = Parametricity.Forbidden;
        this.unique = true;
        // this.controlsDescendants = true;
    }

    protected applySingle(el: HTMLElement, observable: Observable<boolean>, state: INodeState): Subscription {
        const parent = el.parentElement as HTMLElement;
        const placeholder: Comment = document.createComment(`if`);
        parent.insertBefore(placeholder, el);
        let sibling = el.nextSibling;

        this.domManager.nodeStateManager.set(placeholder, state);
        parent.removeChild(el);

        const visibility = observable.map(x => this.inverse ? !x : !!x).distinctUntilChanged();

        // subscribe
        const subscription = visibility.subscribe((x => {
            if (x) {
                this.domManager.applyBindingsToDescendants(state.context, el);
                parent.insertBefore(el, placeholder);
            } else if (el.parentElement === parent) {
                parent.removeChild(el);
                this.domManager.cleanDescendants(el);
            }
        }));
        // apply bindings after if element
        if (el.nextSibling === null && sibling !== null) {
            while (sibling !== null) {
                this.domManager.applyBindingsRecursive(state.context, sibling);
                sibling = sibling.nextSibling;
            }
        }
        subscription.add(() => parent.removeChild(placeholder));
        return subscription;
    }
}

export class IfNotBinding extends IfBinding {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);

        this.inverse = true;
    }
}
