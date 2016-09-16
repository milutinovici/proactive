import * as Rx from "rxjs";
import { IBindingAttribute, IDataContext, INodeState } from "./interfaces";

export class NodeState<T> {
    public model: T;        // scope model
    public cleanup: Rx.Subscription;
    public isBound: boolean;   // true of this node has been touched by applyBindings
    public bindings: IBindingAttribute[] = [];
    public params: IBindingAttribute[] = [];

    constructor(model?: T) {
        this.model = model;
        this.cleanup = new Rx.Subscription();
        this.isBound = false;
    }

    public getBinding(name: string) {
        return this.bindings.filter(x => x.name === name);
    }
}

export class ForEachNodeState<T> extends NodeState<T> {
    public index: Rx.BehaviorSubject<number>;

    constructor(model: T, index: number) {
        super(model);
        this.index = new Rx.BehaviorSubject(index);
        this.cleanup.add(this.index);
    }
}

export class NodeStateManager {
    private nodeState: WeakMap<Node, INodeState<any>>;

    constructor() {
        this.nodeState = new WeakMap<Node, INodeState<any>>();
    }
    public create<T>(model?: T): NodeState<T> {
        return new NodeState(model);
    }

    public isBound(node: Node): boolean {
        let state = this.nodeState.get(node);

        return state != null && !!state.isBound;
    }

    public set<T>(node: Node, state: INodeState<T>): void {
        this.nodeState.set(node, state);
    }

    public get<T>(node: Node): INodeState<T> {
        return this.nodeState.get(node);
    }

    public clear(node: Node) {
        let state = this.nodeState.get(node);

        if (state != null) {
            if (state.cleanup != null) {
                state.cleanup.unsubscribe();
                state.cleanup = undefined;
            }
            state.model = undefined;
            // delete state itself
            this.nodeState.delete(node);
        }
        // support external per-node cleanup
        // env.cleanExternalData(node);
    }
}

export class DataContext implements IDataContext {
    public $data: any = null;
    public $root: any= null;
    public $parent: any= null;
    public $parents: any[]= [];

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
