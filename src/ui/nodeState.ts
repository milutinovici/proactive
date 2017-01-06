import * as Rx from "rxjs";
import { IDataContext, INodeState, IViewModel } from "./interfaces";

export class NodeState<T> implements INodeState<T> {
    public readonly model: IViewModel<T>;        // scope model
    public readonly cleanup: Rx.Subscription;
    public isolate = false;

    constructor(model: IViewModel<T>) {
        this.model = model;
        this.cleanup = new Rx.Subscription();
    }
}

export class ForEachNodeState<T> extends NodeState<T> {
    public readonly index: Rx.BehaviorSubject<number>;

    constructor(model: IViewModel<T>, index: number) {
        super(model);
        this.index = new Rx.BehaviorSubject(index);
        this.cleanup.add(this.index);
    }
}

export class NodeStateManager {
    private readonly dataContextExtensions = new Set<(node: Node, ctx: IDataContext) => void>();
    private readonly weakMap: WeakMap<Node, INodeState<any>>;

    constructor() {
        this.weakMap = new WeakMap<Node, INodeState<any>>();
    }
    public create<T>(model: IViewModel<T>): NodeState<T> {
        return new NodeState(model);
    }

    public set<T>(node: Node, state: INodeState<T>): void {
        this.weakMap.set(node, state);
    }

    public get<T>(node: Node): INodeState<T> | undefined {
        return this.weakMap.get(node);
    }

    public clear(node: Node) {
        const state = this.weakMap.get(node);

        if (state != null) {
            if (state.cleanup != null) {
                state.cleanup.unsubscribe();
            }
            delete state.model;
            // delete state itself
            this.weakMap.delete(node);
        }
        // support external per-node cleanup
        // env.cleanExternalData(node);
    }

    public getDataContext(node: Node): IDataContext {
        let models: any[] = [];
        let state = this.get<any>(node);

        // collect model hierarchy
        let currentNode: Node | null = node;
        while (currentNode) {
            state = state != null ? state : this.weakMap.get(currentNode);
            if (state != null) {
                if (state.model != null) {
                    models.push(state.model);
                }
            }
            // component isolation
            if (state && state.isolate) {
                break;
            }
            state = undefined;
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
    public readonly $data: IViewModel<any>;
    public readonly $root: IViewModel<any>;
    public readonly $parent?: IViewModel<any>;
    public readonly $parents: IViewModel<any>[];

    constructor(models: IViewModel<any>[]) {
        if (models.length > 0) {
            this.$data = models[0];
            this.$root = models[models.length - 1];
            this.$parent = models.length > 1 ? models[1] : undefined;
            this.$parents = models.slice(1);
        }
    }

    public createChildContext(model: IViewModel<any>): IDataContext {
        return new DataContext(this.$parents.concat(this.$data).concat([model]));
    }
}
