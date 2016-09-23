import { NodeStateManager } from "./nodeState";
import { isElement } from "./utils";
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

export class DomManager {
    public readonly nodeState: NodeStateManager;

    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];
    private readonly bindingHandlers: { [name: string]: IBindingHandler<any> } = {};

    constructor(nodeState: NodeStateManager) {
        this.nodeState = nodeState;
        this.registerCoreBindings();
    }

    public applyBindings(model: any, rootNode: Node): void {
        if (rootNode === undefined || !isElement(rootNode)) {
            throw Error("first parameter should be your model, second parameter should be a DOM node!");
        }
        if (this.nodeState.isBound(rootNode)) {
            throw Error("an element must not be bound multiple times!");
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
        this.applyBindingsRecursive(ctx, <HTMLElement> rootNode);
    }

    public applyBindingsToDescendants(ctx: IDataContext, node: HTMLElement): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.children.length; i++) {
                let child = node.children[i];
                this.applyBindingsRecursive(ctx, <HTMLElement> child);
            }
        }
    }

    public cleanNode(rootNode: HTMLElement): void {
        if (!isElement(rootNode)) {
            return;
        }
        this.cleanNodeRecursive(rootNode);
    }

    public cleanDescendants(node: HTMLElement): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.children.length; i++) {
                let child = <HTMLElement> node.children[i];

                this.cleanNodeRecursive(child);
                this.nodeState.clear(child);
            }
        }
    }

    private applyBindingsRecursive(ctx: IDataContext, el: HTMLElement): void {
        if (this.shouldBind(el) && !this.applyBindingsInternal(ctx, el) && el.hasChildNodes()) {
            let child = el.firstElementChild;
            // iterate over descendants
            while (child) {
                this.applyBindingsRecursive(ctx, <HTMLElement> child);
                child = child.nextElementSibling;
            }
        }
    }

    private cleanNodeRecursive(node: HTMLElement): void {
        if (node.hasChildNodes()) {
            let length = node.children.length;

            for (let i = 0; i < length; i++) {
                let child = <HTMLElement> node.children[i];
                // only elements
                if (!isElement(child)) {
                    continue;
                }
                this.cleanNodeRecursive(child);
            }
        }
        // clear parent after childs
        this.nodeState.clear(node);
    }

    private applyBindingsInternal(ctx: IDataContext, el: HTMLElement): boolean {
        let controlsDescendants = false;
        let bindingProvider = new BindingProvider();
        let bindings = bindingProvider.getBindings(el);
        let params = bindingProvider.getParameters(el);

        // get or create elment-state
        let state = this.nodeState.get<any>(el);

        // create and set if necessary
        if (!state) {
            state = this.nodeState.create();
            this.nodeState.set(el, state);
        } else if (state.isBound) {
            // throw Error("an element may be bound multiple times!");
            // return false;
        }

        state.bindings = bindings;
        state.params = params;

        let pairs = this.getBindingHandlers(state.bindings);
        controlsDescendants = pairs.some(x => x.handler.controlsDescendants);

        // apply all bindings
        for (let i = 0; i < pairs.length; i++) {
            const binding = pairs[i].binding;
            const handler = pairs[i].handler;
            // prevent recursive applying of repeat
            if (binding.name === "repeat" && state["index"] !== undefined) {
                continue;
            }
            if (binding.name === "repeat" && state["index"] === undefined) {
                handler.applyBinding(el, binding.expression, ctx, state, binding.parameter);
                return true;
            }
            handler.applyBinding(el, binding.expression, ctx, state, binding.parameter);
        }
        // mark bound
        state.isBound = true;

        return controlsDescendants;
    }

    private shouldBind(el: Element): boolean {
        return !this.ignore.some(x => x === el.tagName);
    }

    public getHandler<T>(name: string): IBindingHandler<T> {
        return this.bindingHandlers[name];
    }
    public registerHandler<T>(name: string, handler: IBindingHandler<T>) {
        this.bindingHandlers[name] = handler;
    }
    public getBindingHandler<T>(attribute: IBindingAttribute): IBindingHandler<T> {
        const handler = this.getHandler<any>(attribute.name);
        if (!handler) {
            throw Error(`binding '${attribute.name}' has not been registered.`);
        }
        return handler;
    }
    public getBindingHandlers(bindings: IBindingAttribute[]) {
        // lookup handlers
        const pairs = bindings.map(x => {
            const handler = this.getBindingHandler(x);
            return { binding: x, handler: handler };
        });
        // sort by priority
        pairs.sort((a, b) => b.handler.priority - a.handler.priority);

        // check if there's binding-handler competition for descendants (which is illegal)
        const hd = pairs.filter(x => x.handler.controlsDescendants).map(x => `'${x.binding.name}'`);
        if (hd.length > 1) {
            throw Error(`bindings ${hd.join(", ")} are competing for descendants of target element!`);
        }
        return pairs;
    }

    private registerCoreBindings() {
        this.registerHandler("css", new CssBinding(this));
        this.registerHandler("attr", new AttrBinding(this));
        this.registerHandler("style", new StyleBinding(this));
        this.registerHandler("evt", new EventBinding(this));
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
