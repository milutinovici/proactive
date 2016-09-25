import * as Rx from "rxjs";
import { IBindingAttribute, IDataContext, INodeState } from "./interfaces";

export class NodeState<T> implements INodeState<T> {
    public  model: T;        // scope model
    public readonly cleanup: Rx.Subscription;
    public isBound: boolean;   // true if this node has been touched by applyBindings
    public readonly bindings: IBindingAttribute[] = [];
    public readonly params: IBindingAttribute[] = [];

    constructor(model?: T) {
        this.model = model;
        this.cleanup = new Rx.Subscription();
        this.isBound = false;
    }

    public getBinding(name: string): IBindingAttribute {
        return this.bindings.filter(x => x.name === name)[0];
    }
}

export class ForEachNodeState<T> extends NodeState<T> {
    public readonly index: Rx.BehaviorSubject<number>;

    constructor(model: T, index: number) {
        super(model);
        this.index = new Rx.BehaviorSubject(index);
        this.cleanup.add(this.index);
    }
}

export class NodeStateManager {
    private readonly dataContextExtensions = new Set<(node: Node, ctx: IDataContext) => void>();
    private readonly nodeState: WeakMap<Node, INodeState<any>>;

    constructor() {
        this.nodeState = new WeakMap<Node, INodeState<any>>();
    }
    public create<T>(model?: T): NodeState<T> {
        return new NodeState(model);
    }

    public isBound(node: Node): boolean {
        const state = this.nodeState.get(node);

        return state != null && !!state.isBound;
    }

    public set<T>(node: Node, state: INodeState<T>): void {
        this.nodeState.set(node, state);
    }

    public get<T>(node: Node): INodeState<T> {
        return this.nodeState.get(node);
    }

    public clear(node: Node) {
        const state = this.nodeState.get(node);

        if (state != null) {
            if (state.cleanup != null) {
                state.cleanup.unsubscribe();
            }
            state.model = undefined;
            // delete state itself
            this.nodeState.delete(node);
        }
        // support external per-node cleanup
        // env.cleanExternalData(node);
    }

    public getDataContext(node: Node): IDataContext {
        let models: any[] = [];
        let state: INodeState<any> | null = this.get<any>(node);

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
    public registerDataContextExtension(extension: (node: Node, ctx: IDataContext) => void) {
        this.dataContextExtensions.add(extension);
    }
}

export class DataContext implements IDataContext {
    public readonly $data: any = null;
    public readonly $root: any= null;
    public readonly $parent: any= null;
    public readonly $parents: any[]= [];

    constructor(models: any[]) {
        if (models.length > 0) {
            this.$data = models[0];
            this.$root = models[models.length - 1];
            this.$parent = models.length > 1 ? models[1] : null;
            this.$parents = models.slice(1);
        }
    }

    public extend(model: any): IDataContext {
        return new DataContext(this.$parents.concat(this.$data).concat[model]);
    }
}
