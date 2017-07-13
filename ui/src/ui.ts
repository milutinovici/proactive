import { Observable } from "rxjs";
import { components, ComponentRegistry } from "./components/registry";
import { DomManager } from "./domManager";
import { NodeStateManager } from "./nodeState";
import { HtmlEngine } from "./templateEngines";
import { IDataContext } from "./interfaces";

export class ProactiveUI {
    public readonly components: ComponentRegistry;
    public readonly domManager: DomManager;
    constructor(document: Document = window.document) {
        this.domManager = new DomManager(new NodeStateManager(), new HtmlEngine(document));
        this.components = components;
    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data context.
    * @param {Object} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(viewModel: Object, node: Element = document.documentElement) {
        this.domManager.applyBindings(viewModel, node);
        if (typeof window !== "undefined") {
            const sub = Observable.fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
                this.domManager.cleanDescendants(node);
                sub.unsubscribe();
            });
        }
    }
    /**
    * Removes and cleans up any binding-related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    public cleanNode(node: Element) {
        this.domManager.cleanNode(node);
    }

    public contextFor(node: Element): IDataContext | undefined {
        const nodeState = this.domManager.nodeStateManager.get(node);
        if (nodeState !== undefined) {
            return nodeState.context;
        }
        return undefined;
    }

    public dataFor(node: Element): any {
        return this.domManager.nodeStateManager.getDataContext(node);
    }

}
