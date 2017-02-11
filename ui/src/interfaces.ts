import { Observable, Subscription, Observer } from "rxjs";

export interface IBindingAttribute<T> {
    readonly tag: string;
    readonly name: string;
    readonly text: string;
    readonly parameter?: string;
    readonly expression: (scope: IDataContext) => T | null;
    evaluate(ctx: IDataContext, element: Element, dataFlow: DataFlow): Observable<T> | Observer<T>;
}

export enum DataFlow { Out = 1, In = 2 }

export interface IBindingHandler {
        readonly name: string;
        /**
        * When there are multiple bindings defined on a single DOM element,
        * sometimes it is necessary to specify the order in which the bindings are applied.
        */
        readonly priority: number;
        readonly dataFlow: DataFlow;
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
        applyBinding(node: Node, state: INodeState): void;

}

export interface IDataContext {
    readonly $data: IViewModel;
    extend(name: string, model: IViewModel, indexName?: string, index?: number): IDataContext;
}
export interface INodeState {
    readonly cleanup: Subscription;
    bindings: Map<string, IBindingAttribute<any>[]>;
    context: IDataContext;
    for?: boolean;
}
export interface IViewModel {
    readonly cleanup?: Subscription;
    readonly value?: Observable<string>;
    readonly emitter?: Observable<CustomEvent>;
}

export interface IComponentDescriptor {
    name?: string;
    template: DocumentFragment | string;
    viewModel?: IViewModel|(new (params?: Object) => IViewModel);
}

export interface IComponent {
    template: DocumentFragment;
    viewModel?: IViewModel;
}
