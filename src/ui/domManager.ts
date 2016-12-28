import { NodeStateManager } from "./nodeState";
import { isElement, groupBy, nodeListToArray } from "./utils";
import { BindingProvider } from "./bindingProvider";
import { IDataContext, IBindingHandler, IBindingAttribute } from "./interfaces";
import EventBinding from "./bindings/event";
import { IfBinding } from "./bindings/if";
import { AttrBinding, CssBinding, StyleBinding, HtmlBinding, TextBinding } from "./bindings/oneWay";
import RepeatBinding from "./bindings/repeat";
import ValueBinding from "./bindings/value";
import WithBinding from "./bindings/with";
import CheckedBinding from "./bindings/checked";
import ComponentBinding from "./bindings/component";
import KeyPressBinding from "./bindings/keypress";
import FocusBinding from "./bindings/focus";
import { exception } from "./exceptionHandlers";

export class DomManager {
    public readonly nodeState: NodeStateManager;

    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];
    private readonly bindingHandlers: { [name: string]: IBindingHandler<any> } = {};

    constructor(nodeState: NodeStateManager) {
        this.nodeState = nodeState;
        this.registerCoreBindings();
    }

    public applyBindings(model: Object, rootNode: Element): void {
        if (rootNode === undefined || !isElement(rootNode)) {
            throw Error("first parameter should be your model, second parameter should be a DOM node!");
        }
        // create or update node state for root node
        let state = this.nodeState.get<any>(rootNode);
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
        let state = this.nodeState.get<any>(el);

        // create and set if necessary
        if (!state) {
            state = this.nodeState.create();
            this.nodeState.set(el, state);
        }

        const handlers = this.getBindingHandlers(bindings);
        const controlsDescendants = handlers.some(x => x.handler.controlsDescendants);

        // apply all bindings
        for (const group of handlers) {
            // prevent recursive applying of repeat
            if (group.name === "repeat" && state["index"] !== undefined) {
                continue;
            }
            // apply repeat before anything else, then imediately return
            if (group.name === "repeat" && state["index"] === undefined) {
                group.handler.applyBinding(el, group.bindings, ctx, state);
                return true;
            }
            group.handler.applyBinding(el, group.bindings, ctx, state);
        }

        return controlsDescendants;
    }

    private shouldBind(el: Element): boolean {
        return !this.ignore.some(x => x === el.tagName);
    }

    public registerHandler<T>(name: string, handler: IBindingHandler<T>) {
        this.bindingHandlers[name] = handler;
    }

    private getBindingHandlers(bindings: IBindingAttribute[]) {
        // lookup handlers
        const handlers: BindingGroup<any>[] = [];
        const group = groupBy(bindings, x => x.name);
        for (const name in group) {
            const handler = this.bindingHandlers[name];
            if (!handler) {
                exception.next(new Error(`Binding handler "${name}" has not been registered. With expression "${group[name][0].text}"`));
                continue;
            }
            handlers.push({ name: name, handler: handler, bindings: group[name] });
        }

        // sort by priority
        handlers.sort((a, b) => b.handler.priority - a.handler.priority);

        // check if there's binding-handler competition for descendants (which is illegal)
        const hd = handlers.filter(x => x.handler.controlsDescendants).map(x => `'${x.name}'`);
        if (hd.length > 1) {
            throw Error(`bindings ${hd.join(", ")} are competing for descendants of target element!`);
        }
        return handlers;
    }

    private registerCoreBindings() {
        this.registerHandler("css", new CssBinding(this));
        this.registerHandler("attr", new AttrBinding(this));
        this.registerHandler("style", new StyleBinding(this));
        this.registerHandler("on", new EventBinding(this));
        this.registerHandler("key", new KeyPressBinding(this));
        this.registerHandler("if", new IfBinding(this));
        this.registerHandler("with", new WithBinding(this));
        this.registerHandler("text", new TextBinding(this));
        this.registerHandler("html", new HtmlBinding(this));
        this.registerHandler("repeat", new RepeatBinding(this));

        this.registerHandler("checked", new CheckedBinding(this));
        // this.registerBinding("selectedValue", "bindings.selectedValue");
        this.registerHandler("component", new ComponentBinding(this));
        this.registerHandler("value", new ValueBinding(this));
        this.registerHandler("focus", new FocusBinding(this));
    }

}

interface BindingGroup<T> {
    name: string;
    handler: IBindingHandler<T>;
    bindings: IBindingAttribute[];
}
