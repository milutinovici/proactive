import { Observable } from "rxjs";
import { components, ComponentRegistry } from "./components/registry";
import { DomManager } from "./domManager";
import { NodeStateManager } from "./nodeState";
import { BindingProvider } from "./bindingProvider";
import { IDataContext } from "./interfaces";

import { EventBinding } from "./bindings/event";
import { IfBinding, IfNotBinding } from "./bindings/if";
import { TextBinding } from "./bindings/text";
import { AttrBinding, CssBinding, StyleBinding, HtmlBinding } from "./bindings/oneWay";
import { ForBinding } from "./bindings/for";
import { AsBinding } from "./bindings/as";
import { ValueBinding } from "./bindings/value";
import { ComponentBinding } from "./bindings/component";
import { KeyPressBinding } from "./bindings/keypress";
import { FocusBinding } from "./bindings/focus";

class ProactiveUI {
    public readonly components: ComponentRegistry;
    private readonly domManager: DomManager;

    constructor() {
        this.domManager = new DomManager(new NodeStateManager());
        this.components = components;
        this.registerCoreBindings();
    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data context.
    * @param {Object} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(viewModel: Object, node: Element = document.documentElement) {
        this.domManager.applyBindings(viewModel, node);
        const sub = Observable.fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
            this.domManager.cleanDescendants(node);
            sub.unsubscribe();
        });
    }
    /**
    * Removes and cleans up any binding-related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    public cleanNode(node: Element) {
        this.domManager.cleanNode(node);
    }

    public contextFor(node: Element): IDataContext | undefined {
        const nodeState = this.domManager.nodeStateManager.get(node);
        if (nodeState !== undefined) {
            return nodeState.context;
        }
        return undefined;
    }

    public dataFor(node: Element): any {
        return this.domManager.nodeStateManager.getDataContext(node);
    }

    private registerCoreBindings() {
        BindingProvider.registerHandler(new CssBinding("css", this.domManager));
        BindingProvider.registerHandler(new AttrBinding("attr", this.domManager));
        BindingProvider.registerHandler(new StyleBinding("style", this.domManager));
        BindingProvider.registerHandler(new EventBinding("on", this.domManager));
        BindingProvider.registerHandler(new KeyPressBinding("key", this.domManager));
        BindingProvider.registerHandler(new IfBinding("if", this.domManager));
        BindingProvider.registerHandler(new IfNotBinding("ifnot", this.domManager));
        BindingProvider.registerHandler(new AsBinding("as", this.domManager));
        BindingProvider.registerHandler(new TextBinding("text", this.domManager));
        BindingProvider.registerHandler(new HtmlBinding("html", this.domManager));
        BindingProvider.registerHandler(new ForBinding("for", this.domManager));

        BindingProvider.registerHandler(new ComponentBinding("component", this.domManager));
        BindingProvider.registerHandler(new ValueBinding("value", this.domManager));
        BindingProvider.registerHandler(new FocusBinding("focus", this.domManager));
    }

}

const ui = new ProactiveUI();
export = ui;
