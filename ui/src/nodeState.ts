import { BehaviorSubject } from "rxjs";
import { IScope, INodeState, IViewModel, IDirective } from "./interfaces";

export class NodeState implements INodeState {
    public scope: IScope;        // scope model
    public readonly directives: IDirective<any>[];
    public readonly constantProps: object;
    public disabled: boolean;
    public controlsDescendants: number;

    constructor(directives: IDirective<any>[], constantProps: object, scope?: IScope) {
        this.scope = scope as IScope;
        this.directives = directives;
        this.constantProps = constantProps;
        this.disabled = false;
        this.controlsDescendants = 0;
    }
    public getDirectives<T>(name: string): IDirective<T>[] {
        return this.directives.filter(x => x.handler.name === name);
    }
}

export class Scope implements IScope {
    public readonly $data: IViewModel;

    constructor(model: IViewModel) {
        this.$data = model;
    }

    public extend(name: string, model: IViewModel, indexName?: string, index?: number): IScope {
        const childScope = Object.assign(new Scope(this.$data), this);
        childScope[name] = model;
        if (indexName !== undefined && index !== undefined) {
            childScope[indexName] = new BehaviorSubject<number>(index);
        }
        return childScope;
    }
}
