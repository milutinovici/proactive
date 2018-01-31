import { Observable } from "rxjs";
import { map, distinctUntilChanged } from "rxjs/operators";
import { BaseHandler } from "./baseHandler";
import { DomManager } from "../domManager";
import { HtmlEngine } from "../templateEngines";
import { IDirective, INodeState, Parametricity } from "../interfaces";

export class IfDirective extends BaseHandler<boolean> {
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

    public applyInternal(element: HTMLElement, directive: IDirective<boolean>, state: INodeState): void {
        const observable = directive.evaluate(state.scope, this.dataFlow) as Observable<boolean>;
        const parent = element.parentElement as HTMLElement;
        const placeholder: Comment = this.engine.createComment("if");
        parent.insertBefore(placeholder, element);
        let sibling = element.nextSibling;

        this.domManager.setState(placeholder, state);
        parent.removeChild(element);

        const visibility = observable.pipe(map(x => this.inverse ? !x : !!x), distinctUntilChanged());

        // subscribe
        directive.cleanup.add(visibility.subscribe((x => {
            state.disabled = !x;
            if (x) {
                this.enableOtherDirectives(element, state);
                this.domManager.applyDirectivesToDescendants(element, state.scope);
                parent.insertBefore(element, placeholder);
            } else if (element.parentElement === parent) {
                parent.removeChild(element);
                this.disableOtherDirectives(state);
                this.domManager.cleanDescendants(element);
            }
        })));
        // apply directives after if element
        if (element.nextSibling === null && sibling !== null) {
            while (sibling !== null) {
                this.domManager.applyDirectivesRecursive(sibling, state.scope);
                sibling = sibling.nextSibling;
            }
        }
        directive.cleanup.add(() => {
            this.domManager.cleanNode(element);
            parent.insertBefore(element, placeholder);
            parent.removeChild(placeholder);
        });
    }
    private disableOtherDirectives(state: INodeState) {
        const others = state.directives.filter(x => x.handler.name !== "if");
        others.forEach(x => x.cleanup.unsubscribe());
    }
    private enableOtherDirectives(element: HTMLElement, state: INodeState) {
        const others = state.directives.filter(x => x.handler.name !== "if");
        others.forEach(x => x.activate(element, state));
    }
}
