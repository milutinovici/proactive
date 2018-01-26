import { Observable } from "rxjs";
import { ComponentRegistry } from "./componentRegistry";
import { DomManager } from "./domManager";
import { HtmlEngine } from "./templateEngines";
import { BindingProvider } from "./bindingProvider";
import { IScope, IConfiguration } from "./interfaces";

import { EventBinding } from "./bindings/event";
import { IfBinding } from "./bindings/if";
import { TextBinding } from "./bindings/text";
import { AttrBinding, CssBinding, StyleBinding } from "./bindings/oneWay";
import { ForBinding } from "./bindings/for";
import { ValueBinding } from "./bindings/value";
import { ComponentBinding } from "./bindings/component";
import { KeyPressBinding } from "./bindings/keypress";

export class ProactiveUI {
    public readonly bindingProvider: BindingProvider;
    public readonly components: ComponentRegistry;
    public readonly domManager: DomManager;
    public readonly engine: HtmlEngine;

    constructor(config: IConfiguration = {}) {
        this.engine = new HtmlEngine(config.document || document);
        this.components = new ComponentRegistry(this.engine, config.router);
        this.bindingProvider = new BindingProvider(this.components);
        this.domManager = new DomManager(this.bindingProvider);
        this.registerCoreBindings(this.domManager, this.engine, this.components);

    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data scope.
    * @param {Object} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(viewModel: Object, node: Element = document.documentElement) {
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
    public cleanNode(node: Element) {
        this.domManager.cleanNode(node);
    }

    public scopeFor(node: Element): IScope | undefined {
        const nodeState = this.domManager.getState(node);
        if (nodeState !== undefined) {
            return nodeState.scope;
        }
        return undefined;
    }

    public dataFor(node: Element): object | undefined {
        const scope = this.domManager.getScope(node);
        if (scope !== undefined) {
            return scope.$data;
        }
        return undefined;
    }

    private registerCoreBindings(domManager: DomManager, engine: HtmlEngine, registry: ComponentRegistry) {
        // out
        this.bindingProvider.registerHandler(new TextBinding("text"));
        this.bindingProvider.registerHandler(new AttrBinding("attr"));
        this.bindingProvider.registerHandler(new CssBinding("css"));
        this.bindingProvider.registerHandler(new StyleBinding("style"));
        // in
        this.bindingProvider.registerHandler(new EventBinding("on"));
        this.bindingProvider.registerHandler(new KeyPressBinding("key"));
        // two way
        this.bindingProvider.registerHandler(new ValueBinding("value"));

        this.bindingProvider.registerHandler(new IfBinding("if", domManager, engine));
        this.bindingProvider.registerHandler(new ForBinding("for", domManager, engine));
        this.bindingProvider.registerHandler(new ComponentBinding("component", domManager, engine, registry));

    }

}
