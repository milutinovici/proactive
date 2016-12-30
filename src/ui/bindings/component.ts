import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { isSubscription, isRxObservable } from "../utils";
import { INodeState, IDataContext, IBindingAttribute, IComponentDescriptor, IComponent, IViewModel } from "../interfaces";
import { BindingBase } from "./bindingBase";
import { components } from "../components/registry";

export default class ComponentBinding<T extends IViewModel> extends BindingBase<T> {
    public priority = 30;
    public controlsDescendants = true;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    public applyBinding(element: HTMLElement, bindings: IBindingAttribute<any>[], ctx: IDataContext, state: INodeState<T>): void {
        const descriptor = this.getComponentDescriptor(element, bindings, ctx);
        const params = this.getParams(bindings, ctx);
        const viewModel = this.getViewModel(element, bindings, ctx, descriptor, params);
        const component = descriptor.combineLatest(viewModel, (desc, vm) => <IComponent<T>> { template: desc.template, viewModel: vm });

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
            if (comp.viewModel) {
                const componentState = this.domManager.nodeState.get<T>(element) || this.domManager.nodeState.create<T>();
                componentState["isolate"] = true;
                componentState.model = comp.viewModel;
                this.domManager.nodeState.set(element, componentState);
                ctx = this.domManager.nodeState.getDataContext(element);
                // auto-dispose view-model
                if (isSubscription(comp.viewModel)) {
                    internal.add(comp.viewModel as any);
                }
                // wire custom events

                if (comp.viewModel.emitter !== undefined && isRxObservable(comp.viewModel.emitter)) {
                    const subscription = comp.viewModel.emitter.subscribe(evt => element.dispatchEvent(evt));
                    internal.add(subscription);
                }
            }

            // done
            this.applyTemplate(element, ctx, state.cleanup, comp.template, <T | undefined> comp.viewModel);
        }));
        state.cleanup.add(doCleanup);
    }

    protected applyTemplate(element: HTMLElement, ctx: IDataContext, cleanup: Subscription, template: Node[], vm?: T) {
        if (template) {
            // clear
            while (element.firstChild) {
                this.domManager.cleanNode(<Element> element.firstChild);
                element.removeChild(element.firstChild);
            }
            // clone template and inject
            for (const node of template) {
                element.appendChild(node.cloneNode(true));
            }
        }

        // invoke preBindingInit
        if (vm && vm.hasOwnProperty("preInit")) {
            (<any> vm).preInit(element, ctx);
        }

        // done
        this.domManager.applyBindingsToDescendants(ctx, element);

        // invoke postBindingInit
        if (vm && vm.hasOwnProperty("postInit")) {
            (<any> vm).postInit(element, ctx);
        }
    }

    private getComponentDescriptor(element: HTMLElement, bindings: IBindingAttribute<any>[], ctx: IDataContext) {
        const componentName = bindings.filter(x => x.parameter === undefined)[0].evaluate(ctx, element, this.twoWay) as Observable<string>;
        return componentName.mergeMap(name => components.load<T>(name));
    }

    private getParams(bindings: IBindingAttribute<any>[], ctx: IDataContext): Object {
        const params = {};
        bindings.filter(x => x.parameter !== undefined).forEach(x => params[<string> x.parameter] = x.expression(ctx));
        return params;
    }

    private getViewModel(element: HTMLElement, bindings: IBindingAttribute<any>[], ctx: IDataContext, descriptor: Observable<IComponentDescriptor<T>>, params: Object) {
        const viewModel = descriptor.map(x => components.initialize(x, params));
        const data = this.getData(element, bindings, ctx);
        return data.combineLatest(viewModel, (d: T, vm: T) => d ? d : vm);
    }

    private getData(element: HTMLElement, bindings: IBindingAttribute<any>[], ctx: IDataContext) {
        const dataBinding = bindings.filter(x => x.parameter === "data")[0] as IBindingAttribute<T>;
        return dataBinding ? dataBinding.evaluate(ctx, element, this.twoWay) as Observable<T> : Observable.of(null);
    }

}
