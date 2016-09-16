import { DataContext, NodeStateManager } from "./nodeState";
import { isElement } from "./utils";
import { BindingProvider } from "./bindingProvider";
import { IDataContext } from "./interfaces";

export class DomManager {
    public nodeState: NodeStateManager;
    private dataContextExtensions = new Set<(node: Node, ctx: IDataContext) => void>();
    private ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];

    constructor() {
        this.nodeState = new NodeStateManager();
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
        let ctx = this.getDataContext(rootNode);
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

    public registerDataContextExtension(extension: (node: Node, ctx: IDataContext) => void) {
        this.dataContextExtensions.add(extension);
    }

    public getDataContext(node: Node): IDataContext {
        let models: any[] = [];
        let state = this.nodeState.get<any>(node);

        // collect model hierarchy
        let currentNode = node;
        while (currentNode) {
            state = state != null ? state : this.nodeState.get(currentNode);
            if (state != null) {
                if (state.model != null) {
                    models.push(state.model);
                }
            }
            // component isolation
            if (state && state["isolate"]) {
                break;
            }
            state = null;
            currentNode = currentNode.parentNode;
        }

        let ctx: IDataContext = new DataContext(models);

        // extensions
        this.dataContextExtensions.forEach(ext => ext(node, ctx));

        return ctx;
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

        let pairs = bindingProvider.getBindingHandlers(state.bindings);
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

}
