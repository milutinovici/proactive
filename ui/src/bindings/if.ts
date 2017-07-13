import { Observable } from "rxjs";
import { BaseHandler } from "./baseHandler";
import { DomManager } from "../domManager";
import { IBinding, INodeState, Parametricity } from "../interfaces";

export class IfBinding extends BaseHandler<boolean> {
    protected inverse: boolean = false;
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 40;
        this.parametricity = Parametricity.Forbidden;
        this.unique = true;
        // this.controlsDescendants = true;
    }

    public applyInternal(element: HTMLElement, binding: IBinding<boolean>, state: INodeState): void {
        const observable = binding.evaluate(state.context, this.dataFlow) as Observable<boolean>;
        const parent = element.parentElement as HTMLElement;
        const placeholder: Comment = this.domManager.engine.createComment("if");
        parent.insertBefore(placeholder, element);
        let sibling = element.nextSibling;

        this.domManager.nodeStateManager.set(placeholder, state);
        parent.removeChild(element);

        const visibility = observable.map(x => this.inverse ? !x : !!x).distinctUntilChanged();

        // subscribe
        binding.cleanup.add(visibility.subscribe((x => {
            state.disabled = !x;
            if (x) {
                this.enableOtherBindings(element, state);
                this.domManager.applyBindingsToDescendants(state.context, element);
                parent.insertBefore(element, placeholder);
            } else if (element.parentElement === parent) {
                parent.removeChild(element);
                this.disableOtherBindings(state);
                this.domManager.cleanDescendants(element);
            }
        })));
        // apply bindings after if element
        if (element.nextSibling === null && sibling !== null) {
            while (sibling !== null) {
                this.domManager.applyBindingsRecursive(state.context, sibling);
                sibling = sibling.nextSibling;
            }
        }
        binding.cleanup.add(() => {
            this.domManager.cleanNode(element);
            parent.insertBefore(element, placeholder);
            parent.removeChild(placeholder);
        });
    }
    private disableOtherBindings(state: INodeState) {
        const others = state.bindings.filter(x => x.handler.name !== "if");
        others.forEach(x => x.cleanup.unsubscribe());
    }
    private enableOtherBindings(element: HTMLElement, state: INodeState) {
        const others = state.bindings.filter(x => x.handler.name !== "if");
        others.forEach(x => x.activate(element, state));
    }
}

export class IfNotBinding extends IfBinding {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);

        this.inverse = true;
    }
}
