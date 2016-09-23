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
    * @param {any} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(model: any, node?: Node) {
        this.domManager.applyBindings(model, node || document.documentElement);
    }
    /**
    * Removes and cleans up any binding-related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    public cleanNode(node: HTMLElement) {
        this.domManager.cleanNode(node);
    }

    public contextFor(node: HTMLElement): IDataContext {
        return this.domManager.nodeState.getDataContext(node);
    }

    public dataFor(node: HTMLElement): any {
        return this.domManager.nodeState.get(node).model;
    }

}

