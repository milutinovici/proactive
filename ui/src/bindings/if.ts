import { Observable } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";
import { BaseHandler } from "./baseHandler";
import { DomManager } from "../domManager";
import { HtmlEngine } from "../templateEngines";
import { IBinding, INodeState, Parametricity } from "../interfaces";

export class IfBinding extends BaseHandler<boolean> {
    private readonly domManager: DomManager;
    private readonly engine: HtmlEngine;
    protected inverse: boolean = false;
    constructor(name: string, domManager: DomManager, engine: HtmlEngine) {
        super(name);
        this.priority = 40;
        this.parametricity = Parametricity.Forbidden;
        this.unique = true;
        // this.controlsDescendants = true;
        this.domManager = domManager;
        this.engine = engine;
    }

    public applyInternal(element: HTMLElement, binding: IBinding<boolean>, state: INodeState): void {
        const observable = binding.evaluate(state.scope, this.dataFlow) as Observable<boolean>;
        const parent = element.parentElement as HTMLElement;
        const placeholder: Comment = this.engine.createComment("if");
        parent.insertBefore(placeholder, element);
        let sibling = element.nextSibling;

        this.domManager.setState(placeholder, state);
        parent.removeChild(element);

        const visibility = observable.pipe(map(x => this.inverse ? !x : !!x), distinctUntilChanged());

        // subscribe
        binding.cleanup.add(visibility.subscribe((x => {
            state.disabled = !x;
            if (x) {
                this.enableOtherBindings(element, state);
                this.domManager.applyBindingsToDescendants(state.scope, element);
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
                this.domManager.applyBindingsRecursive(state.scope, sibling);
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
