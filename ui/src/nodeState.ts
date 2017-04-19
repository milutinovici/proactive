import * as Rx from "rxjs";
import { IDataContext, INodeState, IViewModel, IBinding } from "./interfaces";

export class NodeState implements INodeState {
    public context: IDataContext;        // scope model
    public readonly bindings: IBinding<any>[];
    public for: boolean;
    public disabled: boolean;
    constructor(context: IDataContext) {
        this.context = context;
        this.for = false;
        this.disabled = false;
    }
    public getBindings<T>(name: string): IBinding<T>[] {
        return this.bindings.filter(x => x.handler.name === name);
    }
}

export class NodeStateManager {
    private readonly weakMap: WeakMap<Node, INodeState>;

    constructor() {
        this.weakMap = new WeakMap<Node, INodeState>();
    }

    public set(node: Node, state: INodeState): void {
        this.weakMap.set(node, state);
    }

    public get(node: Node): INodeState | undefined {
        return this.weakMap.get(node);
    }

    public clear(node: Node) {
        const state = this.weakMap.get(node);

        if (state != null) {
            if (state.bindings != null) {
                state.bindings.forEach(x => x.deactivate());
            }
            delete state.context;
            // delete state itself
            this.weakMap.delete(node);
        }
        // support external per-node cleanup
        // env.cleanExternalData(node);
    }
    public getDataContext(node: Node): IDataContext | undefined {
        let currentNode: Node | null = node;
        while (currentNode) {
            let state = this.get(currentNode);
            if (state !== undefined) {
                return state.context;
            }
            currentNode = currentNode.parentNode;
        }
        return undefined;
    }
}

export class DataContext implements IDataContext {
    public readonly $data: IViewModel;

    constructor(model: IViewModel) {
        this.$data = model;
    }

    public extend(name: string, model: IViewModel, indexName?: string, index?: number): IDataContext {
        const childContext = Object["assign"](new DataContext(this.$data), this);
        childContext[name] = model;
        if (indexName !== undefined && index !== undefined) {
            childContext[indexName] = new Rx.BehaviorSubject<number>(index);
        }
        return childContext;
    }
}
