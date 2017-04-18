import { Observable, Subscription, Observer } from "rxjs";

export interface IBinding<T> {
    readonly handler: IBindingHandler;
    readonly text: string;
    readonly parameter?: string;
    readonly cleanup: Subscription;
    readonly expression: (scope: IDataContext) => T | null;
    evaluate(ctx: IDataContext, dataFlow: DataFlow): Observable<T> | Observer<T>;
    activate(node: Node, state: INodeState): void;
}

export enum DataFlow { Out = 1, In = 2 }
export enum Parametricity { Required, Forbidden, Optional }
export interface IBindingHandler {
        readonly name: string;
        /**
        * When there are multiple bindings defined on a single DOM element,
        * sometimes it is necessary to specify the order in which the bindings are applied.
        */
        readonly priority: number;
        // Data flow of the binding, can be In, Out (unidirectional), or both (bidirectional)
        readonly dataFlow: DataFlow;
        // are aditional parameters of a binding required, optional or forbidden
        readonly parametricity: Parametricity;
        // if true, only 1 binding of this type can be on a node
        readonly unique: boolean;
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
        applyBinding(node: Node, binding: IBinding<any>, state: INodeState): void;

}

export interface IDataContext {
    readonly $data: IViewModel;
    extend(name: string, model: IViewModel, indexName?: string, index?: number): IDataContext;
}
export interface INodeState {
    bindings: IBinding<any>[];
    context: IDataContext;
    for: boolean;
    getBindings<T>(name: string): IBinding<T>[];
}
export interface IViewModel {
    readonly cleanup?: Subscription;
    readonly value?: Observable<string>;
    readonly emitter?: Observable<CustomEvent>;
}

export interface IComponentDescriptor {
    readonly name?: string;
    readonly template: DocumentFragment | string;
    readonly viewModel?: IViewModel|(new (params?: Object) => IViewModel);
}

export interface IComponent {
    readonly template: DocumentFragment;
    readonly viewModel?: IViewModel;
}
