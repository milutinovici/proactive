import { Observable } from "rxjs";
import { ComponentRegistry } from "./componentRegistry";
import { DomManager } from "./domManager";
import { HtmlEngine } from "./templateEngines";
import { DirectiveRegistry } from "./bindingProvider";
import { IScope, IConfiguration, IViewModel } from "./interfaces";

import { EventDirective } from "./bindings/event";
import { IfDirective } from "./bindings/if";
import { TextDirective } from "./bindings/text";
import { AttrDirective, CssDirective, StyleDirective } from "./bindings/oneWay";
import { ForDirective } from "./bindings/for";
import { ValueDirective } from "./bindings/value";
import { ComponentDirective } from "./bindings/component";
import { KeyPressDirective } from "./bindings/keypress";

export class ProactiveUI {
    public readonly directives: DirectiveRegistry;
    public readonly components: ComponentRegistry;
    public readonly domManager: DomManager;
    public readonly engine: HtmlEngine;

    constructor(config: IConfiguration = {}) {
        this.engine = new HtmlEngine(config.document || document);
        this.components = new ComponentRegistry(this.engine);
        this.directives = new DirectiveRegistry(this.components);
        this.domManager = new DomManager(this.directives);
        this.registerDirectives(this.domManager, this.engine, this.components);

    }

    /**
    * Applies directives to the specified node and all of its children using the specified data scope.
    * @param {Object} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public render(viewModel: IViewModel, node: Element = document.documentElement) {
        this.domManager.applyDirectives(viewModel, node);
        if (typeof window !== "undefined") {
            const sub = Observable.fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
                this.domManager.cleanDescendants(node);
                sub.unsubscribe();
            });
        }
    }
    /**
    * Removes and cleans up any proactive related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    public clean(node: Element) {
        this.domManager.cleanNode(node);
    }

    public scopeFor(node: Element): IScope | undefined {
        const nodeState = this.domManager.getState(node);
        if (nodeState !== undefined) {
            return nodeState.scope;
        }
        return undefined;
    }

    public dataFor(node: Element): IViewModel | undefined {
        const scope = this.domManager.getScope(node);
        if (scope !== undefined) {
            return scope.$data;
        }
        return undefined;
    }

    private registerDirectives(domManager: DomManager, engine: HtmlEngine, registry: ComponentRegistry) {
        // out
        this.directives.register(new TextDirective("text"));
        this.directives.register(new AttrDirective("attr"));
        this.directives.register(new CssDirective("css"));
        this.directives.register(new StyleDirective("style"));
        // in
        this.directives.register(new EventDirective("on"));
        this.directives.register(new KeyPressDirective("key"));
        // two way
        this.directives.register(new ValueDirective("value"));
        // structural
        this.directives.register(new IfDirective("if", domManager, engine));
        this.directives.register(new ForDirective("for", domManager, engine));
        this.directives.register(new ComponentDirective("component", domManager, engine, registry));

    }

}
