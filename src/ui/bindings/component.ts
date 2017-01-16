import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { isRxObservable } from "../utils";
import { INodeState, IComponentDescriptor, IComponent, IViewModel, IDataContext, IBindingAttribute, DataFlow } from "../interfaces";
import { DataContext } from "../nodeState";
import { SingleBindingBase } from "./bindingBase";
import { AttrBinding } from "./oneWay";
import { components } from "../components/registry";

export class ComponentBinding<T> extends SingleBindingBase<string> {
    public priority = 30;
    public controlsDescendants = true;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applySingleBinding(element: HTMLElement, observable: Observable<string>, state: INodeState) {
        const descriptor = observable.mergeMap(name => components.load(name));
        const params = this.getParams(state);
        const viewModel = this.getViewModel(element, state, descriptor, params);
        const component = descriptor.combineLatest(viewModel, (desc, vm) => <IComponent> { template: desc.template, viewModel: vm });

        // transclusion
        const children = document.createDocumentFragment();
        this.domManager.applyBindingsToDescendants(state.context, element);
        while (element.firstChild) {
            children.appendChild(element.removeChild(element.firstChild));
        }

        let internal: Subscription;
        function doCleanup() {
            if (internal) {
                internal.unsubscribe();
            }
        }

        // subscribe to any input changes
        state.cleanup.add(component.subscribe(comp => {
            doCleanup();
            internal = new Subscription();
            // isolated nodestate and ctx
            let newContext = state.context;
            if (comp.viewModel) {
                newContext = new DataContext(comp.viewModel);

                // wire custom events
                if (comp.viewModel.emitter !== undefined && isRxObservable(comp.viewModel.emitter)) {
                    const subscription = comp.viewModel.emitter.subscribe(evt => element.dispatchEvent(evt));
                    internal.add(subscription);
                }
                // apply attributes to component
                const attributes = comp.viewModel.attributes;
                if (attributes !== undefined) {
                    const attrHandler = this.domManager.getBindingHandler("attr") as AttrBinding;
                    Object.getOwnPropertyNames(attributes).forEach(prop => {
                        if (isRxObservable(attributes[prop])) {
                            internal.add(attrHandler.apply(element, attributes[prop], prop));
                        }
                    });
                }
                // auto-dispose view-model
                if (comp.viewModel.cleanup !== undefined) {
                    internal.add(comp.viewModel.cleanup);
                }
            }

            // done
            this.applyTemplate(element, newContext, comp, children);
        }));
        state.cleanup.add(doCleanup);
    }

    protected applyTemplate(element: HTMLElement, newContext: IDataContext, component: IComponent, children: DocumentFragment) {
        if (component.template) {
            // clear
            while (element.firstChild) {
                this.domManager.cleanNode(<Element> element.firstChild);
                element.removeChild(element.firstChild);
            }
            element.appendChild(component.template);
        }

        // invoke preBindingInit
        if (component.viewModel && component.viewModel.hasOwnProperty("preInit")) {
            (<any> component.viewModel).preInit(element, newContext);
        }

        this.domManager.applyBindingsToDescendants(newContext, element);
        // transclusion
        for (let i = 0; i < element.childNodes.length; i++) {
            const child = element.childNodes[i] as HTMLElement;
            if (child.tagName === "SLOT") {
                element.insertBefore(children, child);
                this.domManager.cleanNode(element.removeChild(child) as HTMLElement);
            }
        }

        // invoke postBindingInit
        if (component.viewModel && component.viewModel.hasOwnProperty("postInit")) {
            (<any> component.viewModel).postInit(element, newContext);
        }
    }

    private getParams(state: INodeState): T {
        const params = {};
        if (state.bindings.has("attr")) {
            (state.bindings.get("attr") as IBindingAttribute<any>[]).forEach(x => params[x.parameter as string] = x.expression(state.context));
        }
        return params as T;
    }

    private getViewModel(element: HTMLElement, state: INodeState, descriptor: Observable<IComponentDescriptor>, params: T): Observable<IViewModel|null> {
        return state.bindings.has("as") ?
               (state.bindings.get("as") as IBindingAttribute<any>[])[0].evaluate(state.context, element, DataFlow.Out) as Observable<IViewModel> :
               descriptor.map(x => components.initialize(x, params));
    }
}
