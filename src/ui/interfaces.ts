import { Observable, Subscription, Observer } from "rxjs";

export interface IBindingAttribute<T> {
    readonly name: string;
    readonly text: string;
    readonly parameter?: string;
    readonly expression: (scope: IDataContext) => T | null;
    evaluate(ctx: IDataContext, element: Element, twoWay: boolean): Observable<T> | Observer<T>;
}

export interface IBindingHandler<T> {
        /**
        * When there are multiple bindings defined on a single DOM element,
        * sometimes it is necessary to specify the order in which the bindings are applied.
        */
        readonly priority: number;
        readonly twoWay: boolean;
       /**
        * If set to true then bindings won't be applied to children
        * of the element such binding is encountered on. Instead
        * the handler will be responsible for that.
        **/
        readonly controlsDescendants: boolean;
       /**
        * Applies the binding to the specified element
        * @param {Node} node The target node
        * @param {any} options The options for the handler
        * @param {IDataContext} ctx The curent data context
        * @param {IDomElementState} state State of the target element
        * @param {IModule} module The module bound to the current binding scope
        **/
        applyBinding(node: Node, bindings: IBindingAttribute<T>[], ctx: IDataContext, state: INodeState<T>): void;

}

export interface IDataContext {
    readonly $data: any;
    readonly $root?: Object;
    readonly $parent?: Object;
    readonly $parents: Object[];
}
export interface INodeState<T> {
    readonly cleanup: Subscription;
    model?: T;        // scope model
}

export interface IComponentDescriptor<T> {
    name?: string;
    template: Node[] | string;
    viewModel?: T|(new (params: any) => T);
}

export interface IComponent<T> {
    template: Node[];
    viewModel?: T;
}
