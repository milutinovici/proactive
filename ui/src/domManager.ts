import { NodeStateManager, DataContext, NodeState } from "./nodeState";
import { isElement, isTextNode, isHandlebarExpression, groupBy } from "./utils";
import { BindingProvider } from "./bindingProvider";
import { IDataContext, IBindingHandler, IViewModel, INodeState } from "./interfaces";

export class DomManager {
    public readonly nodeStateManager: NodeStateManager;
    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];

    constructor(nodeState: NodeStateManager) {
        this.nodeStateManager = nodeState;
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
        const controlsDescendants = BindingProvider.getHandlers(state.bindings, handlers);
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

}
