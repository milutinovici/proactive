import * as Rx from "rxjs";
import { components, ComponentRegistry } from "./components/registry";
import { DomManager } from "./domManager";
import { NodeStateManager } from "./nodeState";
import { IDataContext } from "./interfaces";

class ProactiveUI {
    public readonly components: ComponentRegistry;
    private readonly domManager: DomManager;

    constructor() {
        this.domManager = new DomManager(new NodeStateManager());
        this.components = components;
    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data context.
    * @param {Object} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(viewModel: Object, node: Element = document.documentElement) {
        this.domManager.applyBindings(viewModel, node);
        const sub = Rx.Observable.fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
            this.domManager.cleanDescendants(node);
            sub.unsubscribe();
        });
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

const ui = new ProactiveUI();
export = ui;
