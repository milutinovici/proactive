import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { isRxObservable } from "../utils";
import { INodeState, IComponent, IDataContext, IBindingAttribute } from "../interfaces";
import { DataContext } from "../nodeState";
import { SingleBindingBase } from "./bindingBase";
import { components } from "../components/registry";

export class ComponentBinding<T> extends SingleBindingBase<string> {
    public priority = 20;
    public controlsDescendants = true;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applySingleBinding(element: HTMLElement, observable: Observable<string>, state: INodeState) {
        const descriptor = observable.mergeMap(name => components.load(name));
        const params = this.getParams(state);

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
        state.cleanup.add(descriptor.subscribe(desc => {
            doCleanup();
            internal = new Subscription();
            // isolated nodestate and ctx
            let newContext = state.context;
            const viewModel = components.initialize(desc, params);
            const template = desc.template as DocumentFragment;
            if (viewModel) {
                newContext = new DataContext(viewModel);

                // wire custom events
                if (viewModel.emitter !== undefined && isRxObservable(viewModel.emitter)) {
                    const subscription = viewModel.emitter.subscribe(evt => element.dispatchEvent(evt));
                    internal.add(subscription);
                }
                // apply custom component value
                if (viewModel.value !== undefined && isRxObservable(viewModel.value)) {
                    const subscription = viewModel.value.subscribe(val => {
                        element["value"] = val;
                        element.dispatchEvent(new Event("change"));
                    });
                    internal.add(subscription);
                }

                // auto-dispose view-model
                if (viewModel.cleanup !== undefined) {
                    internal.add(viewModel.cleanup);
                }
            }

            // done
            this.applyTemplate(element, newContext, { template: template, viewModel: viewModel }, children);
        }));
        state.cleanup.add(doCleanup);
    }

    protected applyTemplate(element: HTMLElement, childContext: IDataContext, component: IComponent, children: DocumentFragment) {
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
            (<any> component.viewModel).preInit(element, childContext);
        }

        this.domManager.applyBindingsToDescendants(childContext, element);
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
            (<any> component.viewModel).postInit(element, childContext);
        }
    }

    private getParams(state: INodeState): T {
        const params = {};
        if (state.bindings.has("attr")) {
            (state.bindings.get("attr") as IBindingAttribute<any>[]).forEach(x => params[x.parameter as string] = x.expression(state.context));
        }
        return params as T;
    }
}
