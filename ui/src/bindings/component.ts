import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { isRxObservable } from "../utils";
import { INodeState, IComponent, IDataContext, IBinding, Parametricity } from "../interfaces";
import { DataContext } from "../nodeState";
import { BaseHandler } from "./baseHandler";

export class ComponentBinding<T> extends BaseHandler<string> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 20;
        this.unique = true;
        this.controlsDescendants = true;
        this.parametricity = Parametricity.Forbidden;
    }

    public applyInternal(element: HTMLElement, binding: IBinding<string>, state: INodeState): void {
        const component = this.getComponent(element, binding, state);
        // transclusion
        const children = this.domManager.engine.createFragment();
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
        binding.cleanup.add(component.subscribe(comp => {
            doCleanup();
            internal = new Subscription();
            // isolated nodestate and ctx
            let newContext = state.context;

            if (comp.viewModel) {
                newContext = new DataContext(comp.viewModel);

                // wire custom events
                if (comp.viewModel.emitter !== undefined && isRxObservable(comp.viewModel.emitter)) {
                    internal.add(comp.viewModel.emitter.subscribe(evt => element.dispatchEvent(evt)));
                }
                // apply custom component value
                if (comp.viewModel.value !== undefined && isRxObservable(comp.viewModel.value)) {
                    internal.add(comp.viewModel.value.subscribe(val => {
                        element["value"] = val;
                        const evt = this.domManager.engine.createEvent("change");
                        element.dispatchEvent(evt);
                    }));
                }
                // auto-dispose view-model
                if (comp.viewModel.cleanup !== undefined) {
                    internal.add(comp.viewModel.cleanup);
                }
            }
            // done
            this.applyTemplate(element, newContext, comp, children);
        }));
        binding.cleanup.add(doCleanup);
    }
    protected getComponent(element: HTMLElement, binding: IBinding<string>, state: INodeState): Observable<IComponent> {
        const name = binding.evaluate(state.context, this.dataFlow) as Observable<string>;
        const descriptor = name.mergeMap(n => this.domManager.components.load(n, this.domManager.engine));
        const params = this.getParams(state);
        const vm = this.getVm(state);
        return descriptor.map(desc => <IComponent> { viewModel: this.domManager.components.initialize(desc, params, vm), template: desc.template });
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
