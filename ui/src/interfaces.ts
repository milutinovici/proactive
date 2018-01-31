import { Observable, Subscription, Observer } from "rxjs";

export interface IDirective<T> {
    readonly handler: IDirectiveHandler;
    readonly text: string;
    readonly parameters: string[];
    readonly cleanup: Subscription;
    readonly expression: (scope: IScope) => T | null;
    evaluate(scope: IScope, dataFlow: DataFlow): Observable<T> | Observer<T>;
    activate(node: Node, state: INodeState): void;
    deactivate(): void;
    clone(): IDirective<T>;
}
// Data flow of the directive, can be In, Out (unidirectional), or both (bidirectional)
export enum DataFlow { Out = 1, In = 2 }
// Defines whether the directive accepts parameters
export enum Parametricity { Required, Forbidden, Optional }
export interface IDirectiveHandler {
        readonly name: string;
        /**
        * When there are multiple directives defined on a single DOM element,
        * sometimes it is necessary to specify the order in which the directives are applied.
        */
        readonly priority: number;
        // Data flow of the directive, can be In, Out (unidirectional), or both (bidirectional)
        readonly dataFlow: DataFlow;
        // are aditional parameters of a directive required, optional or forbidden
        readonly parametricity: Parametricity;
        // if true, only 1 directive of this type can be on a node
        readonly unique: boolean;
       /**
        * If set to true then directives won't be applied to children
        * of the element such directive is encountered on. Instead
        * the handler will be responsible for that.
        **/
        readonly controlsDescendants: boolean;
       /**
        * Applies the directive to the specified element
        * @param {Node} node The target node
        * @param {IDirective} directive The directive to be applied
        * @param {INodeState} state State of the target element
        **/
        applyDirective(node: Node, directive: IDirective<any>, state: INodeState): void;
}
// Scope of the view
export interface IScope {
    readonly $data: IViewModel;
    extend(name: string, model: IViewModel, indexName?: string, index?: number): IScope;
}
// Node metadata
export interface INodeState {
    readonly directives: IDirective<any>[];
    readonly constantProps: object;
    readonly controlsDescendants: number;
    readonly scope: IScope;
    disabled: boolean;
    getDirectives<T>(name: string): IDirective<T>[];
}
// Component viewmodel
export interface IViewModel {
    readonly cleanup?: Subscription;
    readonly value?: Observable<string>;
    readonly emitter?: Observable<CustomEvent>;
    [others: string]: any;
}

export interface IComponentDescriptor {
    readonly template: DocumentFragment | string;
    readonly viewModel?: IViewModel | (new (props?: Object) => IViewModel);
    readonly created?: (element: HTMLElement, scope?: IScope) => void;
    readonly destroy?: (element: HTMLElement, scope?: IScope) => void;
}

export interface IComponent {
    readonly name: string;
    readonly template: DocumentFragment;
    readonly viewModel: IViewModel;
    readonly created?: (element: Element, scope?: IScope) => void;
    readonly destroy?: (element: Element, scope?: IScope) => void;
}
export interface IConfiguration {
    document?: Document;
}
