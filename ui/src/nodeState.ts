import * as Rx from "rxjs";
import { IDataContext, INodeState, IViewModel, IBinding } from "./interfaces";

export class NodeState implements INodeState {
    public context: IDataContext;        // scope model
    public readonly bindings: IBinding<any>[];
    public disabled: boolean;
    constructor(context: IDataContext, bindings: IBinding<any>[]) {
        this.context = context;
        this.bindings = bindings;
        this.disabled = false;
    }
    public getBindings<T>(name: string): IBinding<T>[] {
        return this.bindings.filter(x => x.handler.name === name);
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
