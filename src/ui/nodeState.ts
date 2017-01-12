import * as Rx from "rxjs";
import { IDataContext, INodeState, IViewModel, IBindingAttribute } from "./interfaces";
import { Group } from "./utils";

export class NodeState<T extends IDataContext> implements INodeState<T> {
    public context: T;        // scope model
    public readonly cleanup: Rx.Subscription;
    public bindings: Group<IBindingAttribute<any>>;

    constructor(context: T) {
        this.context = context;
        this.cleanup = new Rx.Subscription();
    }
}

export class NodeStateManager {
    private readonly weakMap: WeakMap<Node, INodeState<IDataContext>>;

    constructor() {
        this.weakMap = new WeakMap<Node, INodeState<IDataContext>>();
    }

    public set(node: Node, state: INodeState<IDataContext>): void {
        this.weakMap.set(node, state);
    }

    public get(node: Node): INodeState<IDataContext> | undefined {
        return this.weakMap.get(node);
    }

    public clear(node: Node) {
        const state = this.weakMap.get(node);

        if (state != null) {
            if (state.cleanup != null) {
                state.cleanup.unsubscribe();
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

    public extend(name: string, model: IViewModel, index?: number): IDataContext {
        let childContext;
        if (index !== undefined) {
            childContext = new IndexedDataContext(this.$data, index);
        } else {
            childContext = new DataContext(this.$data);
        }
        childContext[name] = model;
        return childContext;
    }
}

export class IndexedDataContext extends DataContext {
    public readonly $index: Rx.BehaviorSubject<number>;

    constructor(model: IViewModel, index: number) {
        super(model);
        this.$index = new Rx.BehaviorSubject<number>(index);
    }

}
