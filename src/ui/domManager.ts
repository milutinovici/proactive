import { NodeStateManager } from "./nodeState";
import { isElement, nodeListToArray } from "./utils";
import { BindingProvider } from "./bindingProvider";
import { IDataContext, IBindingHandler, IViewModel } from "./interfaces";
import { EventBinding } from "./bindings/event";
import { IfBinding } from "./bindings/if";
import { AttrBinding, CssBinding, StyleBinding, HtmlBinding, TextBinding } from "./bindings/oneWay";
import { RepeatBinding } from "./bindings/repeat";
import { WithBinding } from "./bindings/with";
import { ValueBinding } from "./bindings/value";
import { ComponentBinding } from "./bindings/component";
import { KeyPressBinding } from "./bindings/keypress";
import { FocusBinding } from "./bindings/focus";
import { exception } from "./exceptionHandlers";

export class DomManager {
    public readonly nodeState: NodeStateManager;

    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];
    private readonly bindingHandlers: { [name: string]: IBindingHandler } = {};

    constructor(nodeState: NodeStateManager) {
        this.nodeState = nodeState;
        this.registerCoreBindings();
    }

    public applyBindings(model: IViewModel, rootNode: Element): void {
        if (rootNode === undefined || !isElement(rootNode)) {
            throw Error("first parameter should be your model, second parameter should be a DOM node!");
        }
        // create or update node state for root node
        let state = this.nodeState.get(rootNode);
        if (state) {
            state.model = model;
        } else {
            state = this.nodeState.create(model);
            this.nodeState.set(rootNode, state);
        }

        // calculate resulting data-context and apply bindings
        let ctx = this.nodeState.getDataContext(rootNode);
        this.applyBindingsRecursive(ctx, rootNode);
    }

    public applyBindingsToDescendants(ctx: IDataContext, node: Element): void {
        if (node.hasChildNodes()) {
            const children = nodeListToArray(node.children);
            children.forEach(child => this.applyBindingsRecursive(ctx, child as Element));
        }
    }

    public cleanNode(rootNode: Element): void {
        if (!isElement(rootNode)) {
            return;
        }
        this.cleanNodeRecursive(rootNode);
    }

    public cleanDescendants(node: Element): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.children.length; i++) {
                this.cleanNodeRecursive(node.children[i]);
                this.nodeState.clear(node.children[i]);
            }
        }
    }

    private applyBindingsRecursive(ctx: IDataContext, el: Element): void {
        if (this.shouldBind(el) && !this.applyBindingsInternal(ctx, el) && el.hasChildNodes()) {
            let child = el.firstElementChild;
            // iterate over descendants
            while (child) {
                this.applyBindingsRecursive(ctx, child);
                child = child.nextElementSibling;
            }
        }
    }

    private cleanNodeRecursive(node: Element): void {
        if (node.hasChildNodes()) {
            let length = node.children.length;
            for (let i = 0; i < length; i++) {
                // only elements
                if (!isElement(node.children[i])) {
                    continue;
                }
                this.cleanNodeRecursive(node.children[i]);
            }
        }
        // clear parent after childs
        this.nodeState.clear(node);
    }

    private applyBindingsInternal(ctx: IDataContext, el: Element): boolean {
        const bindingProvider = new BindingProvider();
        const bindings = bindingProvider.getBindings(el);

        // get or create elment-state
        let state = this.nodeState.get(el);
        // create and set if necessary
        if (!state) {
            state = this.nodeState.create(ctx.$data);
            this.nodeState.set(el, state);
        }
        state.bindings = bindings;
        const handlers = this.getHandlers(Object.keys(bindings));
        const controlsDescendants = handlers.some(x => x.controlsDescendants);

        // apply all bindings
        for (const handler of handlers) {
            // prevent recursive applying of repeat
            if (handler.name === "repeat" && state["index"] !== undefined) {
                continue;
            }
            // apply repeat before anything else, then imediately return
            if (handler.name === "repeat" && state["index"] === undefined) {
                handler.applyBinding(el, state, ctx);
                return true;
            }
            handler.applyBinding(el, state, ctx);
        }

        return controlsDescendants;
    }

    private shouldBind(el: Element): boolean {
        return this.ignore.indexOf(el.tagName) === -1;
    }

    public registerHandler(handler: IBindingHandler) {
        this.bindingHandlers[handler.name] = handler;
    }
    public getBindingHandler(name: string) {
        const handler = this.bindingHandlers[name];
        if (!handler) {
            throw new Error(`Binding handler "${name}" has not been registered.`);
        }
        return handler;
    }
    private getHandlers(handlerNames: string[]) {
        // lookup handlers
        const handlers: IBindingHandler[] = [];
        for (const name of handlerNames) {
            const handler = this.bindingHandlers[name];
            if (!handler) {
                exception.next(new Error(`Binding handler "${name}" has not been registered.`));
                continue;
            }
            handlers.push(handler);
        }

        // sort by priority
        handlers.sort((a, b) => b.priority - a.priority);

        // check if there's binding-handler competition for descendants (which is illegal)
        const hd = handlers.filter(x => x.controlsDescendants).map(x => `'${x.name}'`);
        if (hd.length > 1) {
            throw Error(`bindings ${hd.join(", ")} are competing for descendants of target element!`);
        }
        return handlers;
    }

    private registerCoreBindings() {
        this.registerHandler(new CssBinding("css", this));
        this.registerHandler(new AttrBinding("attr", this));
        this.registerHandler(new StyleBinding("style", this));
        this.registerHandler(new EventBinding("on", this));
        this.registerHandler(new KeyPressBinding("key", this));
        this.registerHandler(new IfBinding("if", this));
        this.registerHandler(new WithBinding("with", this));
        this.registerHandler(new TextBinding("text", this));
        this.registerHandler(new HtmlBinding("html", this));
        this.registerHandler(new RepeatBinding("repeat", this));

        this.registerHandler(new ComponentBinding("component", this));
        this.registerHandler(new ValueBinding("value", this));
        this.registerHandler(new FocusBinding("focus", this));
    }

}
