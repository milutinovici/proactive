import * as Rx from "rxjs";
import { components, ComponentRegistry } from "./components/registry";
import { DomManager } from "./domManager";
import { IDataContext } from "./interfaces";

export class ProactiveUI {

    public readonly components: ComponentRegistry;
    private readonly domManager: DomManager;

    constructor(domManager: DomManager) {
        this.domManager = domManager;
        this.components = components;

        Rx.Observable.fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
            this.domManager.cleanDescendants(document.documentElement);
        });
    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data context.
    * @param {Object} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(model: Object, node?: Element) {
        this.domManager.applyBindings(model, node || document.documentElement);
    }
    /**
    * Removes and cleans up any binding-related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    public cleanNode(node: Element) {
        this.domManager.cleanNode(node);
    }

    public contextFor(node: Element): IDataContext {
        return this.domManager.nodeState.getDataContext(node);
    }

    public dataFor(node: Element): any {
        const state = this.domManager.nodeState.get<any>(node);
        if (state !== undefined) {
            return state.model;
        }
        return undefined;
    }

}
