import * as Rx from "rxjs";
import { IScope, INodeState, IViewModel, IBinding } from "./interfaces";

export class NodeState implements INodeState {
    public readonly scope: IScope;        // scope model
    public readonly bindings: IBinding<any>[];
    public readonly otherProps: object;
    public disabled: boolean;

    constructor(scope: IScope, bindings: IBinding<any>[], otherProps: object) {
        this.scope = scope;
        this.bindings = bindings;
        this.otherProps = otherProps;
        this.disabled = false;
    }
    public getBindings<T>(name: string): IBinding<T>[] {
        return this.bindings.filter(x => x.handler.name === name);
    }
}

export class Scope implements IScope {
    public readonly $data: IViewModel;

    constructor(model: IViewModel) {
        this.$data = model;
    }

    public extend(name: string, model: IViewModel, indexName?: string, index?: number): IScope {
        const childScope = Object["assign"](new Scope(this.$data), this);
        childScope[name] = model;
        if (indexName !== undefined && index !== undefined) {
            childScope[indexName] = new Rx.BehaviorSubject<number>(index);
        }
        return childScope;
    }
}
