import { NodeStateManager, DataContext, NodeState } from "./nodeState";
import { isElement, isTextNode, isHandlebarExpression, groupBy } from "./utils";
import { BindingProvider } from "./bindingProvider";
import { IDataContext, IBindingHandler, IViewModel, INodeState, IBindingAttribute } from "./interfaces";
import { EventBinding } from "./bindings/event";
import { IfBinding } from "./bindings/if";
import { TextBinding } from "./bindings/text";
import { AttrBinding, CssBinding, StyleBinding, HtmlBinding } from "./bindings/oneWay";
import { ForBinding } from "./bindings/for";
import { AsBinding } from "./bindings/as";
import { ValueBinding } from "./bindings/value";
import { ComponentBinding } from "./bindings/component";
import { KeyPressBinding } from "./bindings/keypress";
import { FocusBinding } from "./bindings/focus";
import { exception } from "./exceptionHandlers";

export class DomManager {
    public readonly nodeStateManager: NodeStateManager;

    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];
    private readonly bindingHandlers = new Map<string, IBindingHandler>();

    constructor(nodeState: NodeStateManager) {
        this.nodeStateManager = nodeState;
        this.registerCoreBindings();
    }

    public applyBindings(model: IViewModel, rootNode: Element): void {
        if (rootNode === undefined || !isElement(rootNode)) {
            throw Error("first parameter should be your model, second parameter should be a DOM node!");
        }
        // create or update node state for root node
        const context = new DataContext(model);
        let state = this.nodeStateManager.get(rootNode) as INodeState;
        if (state === undefined) {
            state = new NodeState(context);
            this.nodeStateManager.set(rootNode, state);
        } else {
            state.context = context;
        }

        // calculate resulting data-context and apply bindings
        this.applyBindingsRecursive(state.context, rootNode);
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
        const bindings = BindingProvider.getBindings(el);
        if (bindings.length === 0) {
            return false;
        }
        // get or create elment-state
        let state = this.nodeStateManager.get(el);
        // create and set if necessary
        if (!state) {
            state = new NodeState(ctx);
            this.nodeStateManager.set(el, state);
        }
        state.bindings = groupBy(bindings, x => x.name);
        const handlers: IBindingHandler[] = [];
        const controlsDescendants = this.getHandlers(state.bindings, handlers);
        // apply all bindings
        for (const handler of handlers) {
            // prevent recursive applying of for
            if (handler.name === "for" && state.for) {
                continue;
            }
            // apply for before anything else, then imediately return
            if (handler.name === "for" && !state.for) {
                handler.applyBinding(el, state);
                return true;
            }
            handler.applyBinding(el, state);
        }

        return controlsDescendants !== 0;
    }

    private shouldBind(el: Node): boolean {
        return (isElement(el) && this.ignore.indexOf(el.tagName) === -1) ||
               (isTextNode(el) && isHandlebarExpression(el.nodeValue));
    }

    public registerHandler(handler: IBindingHandler) {
        this.bindingHandlers.set(handler.name, handler);
    }
    public getBindingHandler(name: string) {
        const handler = this.bindingHandlers.get(name);
        if (!handler) {
            throw new Error(`Binding handler "${name}" has not been registered.`);
        }
        return handler;
    }
    private getHandlers(bindings: Map<string, IBindingAttribute<any>[]>, handlers: IBindingHandler[]) {
        let controlsDescendants = 0;
        bindings.forEach((val, name) => {
            const handler = this.bindingHandlers.get(name);
            if (!handler) {
                exception.next(new Error(`Binding handler "${name}" has not been registered.`));
            } else {
                if (handler.controlsDescendants) {
                    controlsDescendants += 1;
                }
                handlers.push(handler);
            }
        });
        // sort by priority
        handlers.sort((a, b) => b.priority - a.priority);

        if (controlsDescendants > 1) {
            throw Error(`bindings are competing for descendants of target element!`);
        }
        return controlsDescendants;
    }

    private registerCoreBindings() {
        this.registerHandler(new CssBinding("css", this));
        this.registerHandler(new AttrBinding("attr", this));
        this.registerHandler(new StyleBinding("style", this));
        this.registerHandler(new EventBinding("on", this));
        this.registerHandler(new KeyPressBinding("key", this));
        this.registerHandler(new IfBinding("if", this));
        this.registerHandler(new AsBinding("as", this));
        this.registerHandler(new TextBinding("text", this));
        this.registerHandler(new HtmlBinding("html", this));
        this.registerHandler(new ForBinding("for", this));

        this.registerHandler(new ComponentBinding("component", this));
        this.registerHandler(new ValueBinding("value", this));
        this.registerHandler(new FocusBinding("focus", this));
    }

}
