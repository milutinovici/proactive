import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { isRxObservable } from "../utils";
import { INodeState, IComponent, IDataContext, IBinding, Parametricity } from "../interfaces";
import { DataContext } from "../nodeState";
import { BaseHandler } from "./baseHandler";
import { components } from "../components/registry";

export class ComponentBinding<T> extends BaseHandler<string> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 20;
        this.unique = true;
        this.controlsDescendants = true;
        this.parametricity = Parametricity.Forbidden;
    }

    public applyInternal(element: HTMLElement, binding: IBinding<string>, state: INodeState): void {
        const observable = binding.evaluate(state.context, this.dataFlow) as Observable<string>;
        const descriptor = observable.mergeMap(name => components.load(name));
        const params = this.getParams(state);
        const vm = this.getVm(state);
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
        binding.cleanup.add(descriptor.subscribe(desc => {
            doCleanup();
            internal = new Subscription();
            // isolated nodestate and ctx
            let newContext = state.context;
            const viewModel = components.initialize(desc, params, vm);
            const template = desc.template as DocumentFragment;
            if (viewModel) {
                newContext = new DataContext(viewModel);

                // wire custom events
                if (viewModel.emitter !== undefined && isRxObservable(viewModel.emitter)) {
                    internal.add(viewModel.emitter.subscribe(evt => element.dispatchEvent(evt)));
                }
                // apply custom component value
                if (viewModel.value !== undefined && isRxObservable(viewModel.value)) {
                    internal.add(viewModel.value.subscribe(val => {
                        element["value"] = val;
                        element.dispatchEvent(new Event("change"));
                    }));
                }

                // auto-dispose view-model
                if (viewModel.cleanup !== undefined) {
                    internal.add(viewModel.cleanup);
                }
            }

            // done
            this.applyTemplate(element, newContext, { template: template, viewModel: viewModel }, children);
        }));
        binding.cleanup.add(doCleanup);
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
                element.insertBefore(children.cloneNode(true), child);
                this.domManager.cleanNode(element.removeChild(child) as HTMLElement);
            }
        }

        // invoke postBindingInit
        if (component.viewModel && component.viewModel.hasOwnProperty("postInit")) {
            (<any> component.viewModel).postInit(element, childContext);
        }
    }

    private getParams(state: INodeState): T {
        const params = {} as T;
        const attributes = state.getBindings<any>("attr");
        if (attributes.length > 0) {
            attributes.forEach(x => params[x.parameter as string] = x.expression(state.context));
        }
        return params;
    }
    private getVm(state: INodeState): T | undefined {
        const vm = state.getBindings<T>("as")[0];
        if (vm !== undefined) {
            return vm.expression(state.context) as T;
        }
        return undefined;
    }
}
