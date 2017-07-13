import { NodeStateManager, DataContext, NodeState } from "./nodeState";
import { HtmlEngine } from "./templateEngines";
import { isElement, isTextNode, isHandlebarExpression } from "./utils";
import { BindingProvider } from "./bindingProvider";
import { components, ComponentRegistry } from "./components/registry";
import { IDataContext, IViewModel } from "./interfaces";

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

export class DomManager {
    public readonly engine: HtmlEngine;
    public readonly nodeStateManager: NodeStateManager;
    public readonly bindingProvider: BindingProvider;
    public readonly components: ComponentRegistry;
    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];

    constructor(nodeState: NodeStateManager, engine: HtmlEngine) {
        this.bindingProvider = new BindingProvider();
        this.nodeStateManager = nodeState;
        this.engine = engine;
        this.components = components;
        this.registerCoreBindings();
    }

    public applyBindings(model: IViewModel, rootNode: Element): void {
        if (rootNode === undefined || !isElement(rootNode)) {
            throw Error("first parameter should be your model, second parameter should be a DOM node!");
        }
        // create or update node state for root node
        const context = new DataContext(model);

        // calculate resulting data-context and apply bindings
        this.applyBindingsRecursive(context, rootNode);
    }

    public applyBindingsToDescendants(ctx: IDataContext, node: Element): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.applyBindingsRecursive(ctx, node.childNodes[i] as Element);
            }
        }
    }

    public cleanNode(rootNode: Element): void {
        if (!isElement(rootNode) && !isTextNode(rootNode)) {
            return;
        }
        this.cleanNodeRecursive(rootNode);
    }

    public cleanDescendants(node: Element): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.cleanNodeRecursive(node.childNodes[i]);
                this.nodeStateManager.clear(node.childNodes[i]);
            }
        }
    }

    public applyBindingsRecursive(ctx: IDataContext, el: Node): void {
        if (this.shouldBind(el) && !this.applyBindingsInternal(ctx, el) && el.hasChildNodes()) {
            let child = el.firstChild;
            // iterate over descendants
            while (child) {
                this.applyBindingsRecursive(ctx, child);
                child = child.nextSibling;
            }
        }
    }
    private cleanNodeRecursive(node: Node): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.cleanNodeRecursive(node.childNodes[i]);
            }
        }
        // clear parent after childs
        this.nodeStateManager.clear(node);
    }

    private applyBindingsInternal(ctx: IDataContext, el: Node): boolean {
        // get or create elment-state
        let state = this.nodeStateManager.get(el);
        // create and set if necessary
        if (!state) {
            const bindings = this.bindingProvider.getBindings(el);
            if (bindings.length === 0) {
                return false;
            }
            state = new NodeState(ctx, bindings);
            this.nodeStateManager.set(el, state);
        }

        // apply all bindings
        for (const binding of state.bindings) {
            // if binding disables other bindings when false 
            if (state.disabled === true) {
                return true;
            }
            // apply for before anything else, then imediately return
            if (binding.handler.name === "for") {
                binding.activate(el, state);
                return true;
            }
            binding.activate(el, state);
        }

        return state.bindings.some(x => x.handler.controlsDescendants);
    }

    private shouldBind(el: Node): boolean {
        return (isElement(el) && this.ignore.indexOf(el.tagName) === -1) ||
               (isTextNode(el) && isHandlebarExpression(el.nodeValue));
    }
    private registerCoreBindings() {
        this.bindingProvider.registerHandler(new CssBinding("css", this));
        this.bindingProvider.registerHandler(new AttrBinding("attr", this));
        this.bindingProvider.registerHandler(new StyleBinding("style", this));
        this.bindingProvider.registerHandler(new EventBinding("on", this));
        this.bindingProvider.registerHandler(new KeyPressBinding("key", this));
        this.bindingProvider.registerHandler(new IfBinding("if", this));
        this.bindingProvider.registerHandler(new IfNotBinding("ifnot", this));
        this.bindingProvider.registerHandler(new AsBinding("as", this));
        this.bindingProvider.registerHandler(new TextBinding("text", this));
        this.bindingProvider.registerHandler(new HtmlBinding("html", this));
        this.bindingProvider.registerHandler(new ForBinding("for", this));

        this.bindingProvider.registerHandler(new ComponentBinding("component", this));
        this.bindingProvider.registerHandler(new ValueBinding("value", this));
        this.bindingProvider.registerHandler(new FocusBinding("focus", this));

    }
}
