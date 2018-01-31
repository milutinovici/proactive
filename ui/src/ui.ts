import { Observable } from "rxjs";
import { ComponentRegistry } from "./componentRegistry";
import { DomManager } from "./domManager";
import { HtmlEngine } from "./templateEngines";
import { BindingProvider } from "./bindingProvider";
import { IScope, IConfiguration, IViewModel } from "./interfaces";

import { EventBinding } from "./bindings/event";
import { IfBinding } from "./bindings/if";
import { TextBinding } from "./bindings/text";
import { AttrBinding, CssBinding, StyleBinding } from "./bindings/oneWay";
import { ForBinding } from "./bindings/for";
import { ValueBinding } from "./bindings/value";
import { ComponentBinding } from "./bindings/component";
import { KeyPressBinding } from "./bindings/keypress";

export class ProactiveUI {
    public readonly directives: BindingProvider;
    public readonly components: ComponentRegistry;
    public readonly domManager: DomManager;
    public readonly engine: HtmlEngine;

    constructor(config: IConfiguration = {}) {
        this.engine = new HtmlEngine(config.document || document);
        this.components = new ComponentRegistry(this.engine);
        this.directives = new BindingProvider(this.components);
        this.domManager = new DomManager(this.directives);
        this.registerCoreBindings(this.domManager, this.engine, this.components);

    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data scope.
    * @param {Object} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(viewModel: IViewModel, node: Element = document.documentElement) {
        this.domManager.applyBindings(viewModel, node);
        if (typeof window !== "undefined") {
            const sub = Observable.fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
                this.domManager.cleanDescendants(node);
                sub.unsubscribe();
            });
        }
    }
    /**
    * Removes and cleans up any binding-related state from the specified node and its descendants.
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

    private registerCoreBindings(domManager: DomManager, engine: HtmlEngine, registry: ComponentRegistry) {
        // out
        this.directives.register(new TextBinding("text"));
        this.directives.register(new AttrBinding("attr"));
        this.directives.register(new CssBinding("css"));
        this.directives.register(new StyleBinding("style"));
        // in
        this.directives.register(new EventBinding("on"));
        this.directives.register(new KeyPressBinding("key"));
        // two way
        this.directives.register(new ValueBinding("value"));
        // structural
        this.directives.register(new IfBinding("if", domManager, engine));
        this.directives.register(new ForBinding("for", domManager, engine));
        this.directives.register(new ComponentBinding("component", domManager, engine, registry));

    }

}
