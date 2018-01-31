import { Scope } from "./nodeState";
import { DirectiveRegistry } from "./directiveRegistry";
import { isElement, isTextNode, isHandlebarExpression } from "./utils";
import { INodeState, IScope, IViewModel } from "./interfaces";
import { exception } from "./exceptionHandlers";

export class DomManager {
    private readonly nodeStateManager: WeakMap<Node, INodeState>;
    private readonly directiveRegistry: DirectiveRegistry;

    private readonly ignore = ["SCRIPT", "TEXTAREA", "TEMPLATE"];

    constructor(directiveRegistry: DirectiveRegistry) {
        this.nodeStateManager = new WeakMap<Node, INodeState>();
        this.directiveRegistry = directiveRegistry;
    }

    public applyDirectives(model: IViewModel, rootNode: Element): void {
        if (rootNode === undefined || !isElement(rootNode)) {
            throw Error("first parameter should be your model, second parameter should be a DOM node!");
        }
        // create or update node state for root node
        const scope = new Scope(model);

        // calculate resulting scope and apply directives
        this.applyDirectivesRecursive(rootNode, scope);
    }

    public applyDirectivesToDescendants(node: Node, scope: IScope): void {
        if (node.hasChildNodes()) {
            for (let i = 0; i < node.childNodes.length; i++) {
                this.applyDirectivesRecursive(node.childNodes[i], scope);
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

    public applyDirectivesRecursive(node: Node, scope: IScope): void {
        if (this.shouldBind(node) && !this.applyDirectivesInternal(node, scope) && node.hasChildNodes()) {
            let child = node.firstChild;
            // iterate over descendants
            while (child) {
                this.applyDirectivesRecursive(child, scope);
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
            if (state.directives != null) {
                state.directives.forEach(x => x.deactivate());
            }
            // delete state itself
            this.nodeStateManager.delete(node);
        }
        // support external per-node cleanup
        // env.cleanExternalData(node);
    }
    private applyDirectivesInternal(node: Node, scope: IScope): boolean {
        // create and set if necessary
        const state = this.nodeStateManager.get(node) || this.createState(node, scope);
        if (state === null) {
            return false;
        }

        // apply all directives
        for (const directive of state.directives) {
            // if directive disables other directive when false 
            if (state.disabled === true) {
                return true;
            }
            // apply for before anything else, then imediately return
            if (directive.handler.name === "for") {
                directive.activate(node, state);
                return true;
            }
            directive.activate(node, state);
        }

        return state.directives.some(x => x.handler.controlsDescendants);
    }

    private createState(node: Node, scope: IScope): INodeState | null {
        const state = this.directiveRegistry.createNodeState(node);
        if (state === null) {
            return null;
        } else if (state.controlsDescendants > 1) {
            exception.next(new Error(`directives are competing for descendants of ${node}`));
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
