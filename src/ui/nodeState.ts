import * as Rx from "rxjs";
import { IDataContext, INodeState, IViewModel, IBindingAttribute } from "./interfaces";
import { Group } from "./utils";

export class NodeState implements INodeState {
    public model: IViewModel;        // scope model
    public readonly cleanup: Rx.Subscription;
    public isolate = false;
    public bindings: Group<IBindingAttribute<any>>;

    constructor(model: IViewModel) {
        this.model = model;
        this.cleanup = new Rx.Subscription();
    }
}

export class ForEachNodeState extends NodeState {
    public readonly index: Rx.BehaviorSubject<number>;

    constructor(model: IViewModel, index: number) {
        super(model);
        this.index = new Rx.BehaviorSubject(index);
        this.cleanup.add(this.index);
    }
}

export class NodeStateManager {
    private readonly dataContextExtensions = new Set<(node: Node, ctx: IDataContext) => void>();
    private readonly weakMap: WeakMap<Node, INodeState>;

    constructor() {
        this.weakMap = new WeakMap<Node, INodeState>();
    }
    public create(model: IViewModel): NodeState {
        return new NodeState(model);
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
        let state = this.get(node);

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
    public readonly $data: IViewModel;
    public readonly $root: IViewModel;
    public readonly $parent?: IViewModel;
    public readonly $parents: IViewModel[];

    constructor(models: IViewModel[]) {
        if (models.length > 0) {
            this.$data = models[0];
            this.$root = models[models.length - 1];
            this.$parent = models.length > 1 ? models[1] : undefined;
            this.$parents = models.slice(1);
        }
    }

    public createChildContext(model: IViewModel): IDataContext {
        return new DataContext(this.$parents.concat(this.$data).concat([model]));
    }
}
