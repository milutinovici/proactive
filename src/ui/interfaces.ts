import * as Rx from "rxjs";

export interface IBindingAttribute {
    name: string;
    parameter?: string;
    expression: ICompiledExpression<any>;
}
export interface ICompiledExpression<T> {
    (scope?: IDataContext, element?: Element): T;

    literal?: boolean;
    constant?: boolean;
    write?: (scope?: IDataContext, element?: Element) => (value: T) => void;
}

export interface IBindingHandler<T> {
        /**
        * When there are multiple bindings defined on a single DOM element,
        * sometimes it is necessary to specify the order in which the bindings are applied.
        */
        priority: number;

       /**
        * If set to true then bindings won't be applied to children
        * of the element such binding is encountered on. Instead
        * the handler will be responsible for that.
        **/
        controlsDescendants: boolean;
       /**
        * Applies the binding to the specified element
        * @param {Node} node The target node
        * @param {any} options The options for the handler
        * @param {IDataContext} ctx The curent data context
        * @param {IDomElementState} state State of the target element
        * @param {IModule} module The module bound to the current binding scope
        **/
        applyBinding(node: Node, expression: ICompiledExpression<T>, ctx: IDataContext, state: INodeState<T>, parameter?: string): void;

}

export interface IDataContext {
    $data: any;
    $root: any;
    $parent: any;
    $parents: any[];
}
export interface INodeState<T> {
    cleanup: Rx.Subscription;
    isBound: boolean;   // true of this node has been touched by applyBindings
    model?: T;        // scope model
    bindings: IBindingAttribute[];
    params: IBindingAttribute[];
}

export interface IComponentDescriptor<T> {
    template: Node[] | string;
    viewModel?: T|(new (params: any) => T);
}

export interface IComponent<T> {
    template?: Node[];
    viewModel?: T;
}
