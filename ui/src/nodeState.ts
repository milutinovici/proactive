import { BehaviorSubject } from "rxjs";
import { IKeyValue, INodeState, IPair, IScope, IViewModel } from "./interfaces";

export class NodeState implements INodeState {
    public scope: IScope;        // scope model
    public readonly directives: IPair[];
    public readonly constantProps: IKeyValue;
    public disabled: boolean;
    public controlsDescendants: number;

    constructor(directives: IPair[], constantProps: IKeyValue, scope: IScope) {
        this.scope = scope as IScope;
        this.directives = directives;
        this.constantProps = constantProps;
        this.disabled = false;
        this.controlsDescendants = 0;
    }
    public getDirectives<T>(name: string): Array<IPair<T>> {
        return this.directives.filter((x) => x.directive.name === name) as Array<IPair<T>>;
    }
}

export class Scope implements IScope {
    public readonly $data: IViewModel;
    readonly [others: string]: unknown;
    constructor(model: IViewModel) {
        this.$data = model;
    }

    public extend(name: string, model: IViewModel, indexName?: string, index?: number): IScope {
        const childScope = Object.assign(new Scope(this.$data), this) as IScope;
        childScope[name] = model;
        if (indexName !== undefined && index !== undefined) {
            childScope[indexName] = new BehaviorSubject<number>(index);
        }
        return childScope;
    }
}
