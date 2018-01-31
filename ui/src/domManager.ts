import { Scope } from "./nodeState";
import { BindingProvider } from "./bindingProvider";
import { isElement, isTextNode, isHandlebarExpression } from "./utils";
import { INodeState, IScope, IViewModel } from "./interfaces";
import { exception } from "./exceptionHandlers";

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
        this.applyBindingsRecursive(rootNode, scope);
    }

    public applyBindingsToDescendants(node: Node, scope: IScope): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.applyBindingsRecursive(node.childNodes[i], scope);
            }
        }
    }

    public cleanNode(rootNode: Node): void {
        if (!isElement(rootNode) && !isTextNode(rootNode)) {
            return;
        }
        this.cleanNodeRecursive(rootNode);
    }

    public cleanDescendants(node: Node): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.cleanNodeRecursive(node.childNodes[i]);
                this.clear(node.childNodes[i]);
            }
        }
    }

    public applyBindingsRecursive(node: Node, scope: IScope): void {
        if (this.shouldBind(node) && !this.applyBindingsInternal(node, scope) && node.hasChildNodes()) {
            let child = node.firstChild;
            // iterate over descendants
            while (child) {
                this.applyBindingsRecursive(child, scope);
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
            // delete state itself
            this.nodeStateManager.delete(node);
        }
        // support external per-node cleanup
        // env.cleanExternalData(node);
    }
    private applyBindingsInternal(node: Node, scope: IScope): boolean {
        // create and set if necessary
        const state = this.nodeStateManager.get(node) || this.createState(node, scope);
        if (state === null) {
            return false;
        }

        // apply all bindings
        for (const binding of state.bindings) {
            // if binding disables other bindings when false 
            if (state.disabled === true) {
                return true;
            }
            // apply for before anything else, then imediately return
            if (binding.handler.name === "for") {
                binding.activate(node, state);
                return true;
            }
            binding.activate(node, state);
        }

        return state.bindings.some(x => x.handler.controlsDescendants);
    }

    private createState(node: Node, scope: IScope): INodeState | null {
        const state = this.bindingProvider.createNodeState(node);
        if (state === null) {
            return null;
        } else if (state.controlsDescendants > 1) {
            exception.next(new Error(`bindings are competing for descendants of target element!`));
        }
        state.scope = scope;
        this.nodeStateManager.set(node, state);
        return state;
    }

    private shouldBind(el: Node): boolean {
        return (isElement(el) && this.ignore.indexOf(el.tagName) === -1) ||
               (isTextNode(el) && isHandlebarExpression(el.nodeValue));
    }
}
