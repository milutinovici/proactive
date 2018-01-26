import { Scope, NodeState } from "./nodeState";
import { BindingProvider } from "./bindingProvider";
import { isElement, isTextNode, isHandlebarExpression } from "./utils";
import { INodeState, IScope, IViewModel } from "./interfaces";

export class DomManager {
    private readonly nodeStateManager: WeakMap<Node, INodeState>;
    private readonly bindingProvider: BindingProvider;

    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];

    constructor(bindingProvider: BindingProvider) {
        this.nodeStateManager = new WeakMap<Node, INodeState>();
        this.bindingProvider = bindingProvider;
    }

    public applyBindings(model: IViewModel, rootNode: Element): void {
        if (rootNode === undefined || !isElement(rootNode)) {
            throw Error("first parameter should be your model, second parameter should be a DOM node!");
        }
        // create or update node state for root node
        const scope = new Scope(model);

        // calculate resulting scope and apply bindings
        this.applyBindingsRecursive(scope, rootNode);
    }

    public applyBindingsToDescendants(ctx: IScope, node: Element): void {
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
                this.clear(node.childNodes[i]);
            }
        }
    }

    public applyBindingsRecursive(ctx: IScope, el: Node): void {
        if (this.shouldBind(el) && !this.applyBindingsInternal(ctx, el) && el.hasChildNodes()) {
            let child = el.firstChild;
            // iterate over descendants
            while (child) {
                this.applyBindingsRecursive(ctx, child);
                child = child.nextSibling;
            }
        }
    }
    public setState(node: Node, state: INodeState): void {
        this.nodeStateManager.set(node, state);
    }

    public getState(node: Node): INodeState | undefined {
        return this.nodeStateManager.get(node);
    }
    public getScope(node: Node): IScope | undefined {
        let currentNode: Node | null = node;
        while (currentNode) {
            let state = this.nodeStateManager.get(currentNode);
            if (state !== undefined) {
                return state.scope;
            }
            currentNode = currentNode.parentNode;
        }
        return undefined;
    }
    private cleanNodeRecursive(node: Node): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.cleanNodeRecursive(node.childNodes[i]);
            }
        }
        // clear parent after childs
        this.clear(node);
    }
    private clear(node: Node) {
        const state = this.nodeStateManager.get(node);

        if (state != null) {
            if (state.bindings != null) {
                state.bindings.forEach(x => x.deactivate());
            }
            delete state.scope;
            // delete state itself
            this.nodeStateManager.delete(node);
        }
        // support external per-node cleanup
        // env.cleanExternalData(node);
    }
    private applyBindingsInternal(ctx: IScope, el: Node): boolean {
        // get or create elment-state
        let state = this.nodeStateManager.get(el);
        // create and set if necessary
        if (!state) {
            const bindingsAndProps = this.bindingProvider.getBindingsAndProps(el);
            const bindings = bindingsAndProps[0];
            if (bindings.length === 0) {
                return false;
            }
            state = new NodeState(ctx, bindings, bindingsAndProps[1]);
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
}
