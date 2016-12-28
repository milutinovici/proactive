import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { isDisposable } from "../utils";
import { INodeState, IDataContext, IBindingAttribute } from "../interfaces";
import { BindingBase } from "./bindingBase";
import { components } from "../components/registry";

export default class ComponentBinding<T> extends BindingBase<T> {
    public priority = 30;
    public controlsDescendants = true;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    public applyBinding(element: HTMLElement, bindings: IBindingAttribute[], ctx: IDataContext, state: INodeState<T>): void {
        const componentName = this.evaluateBinding<string>(bindings.filter(x => x.parameter === undefined)[0], ctx, element) as Rx.Observable<string>;
        let vmBinding = bindings.filter(x => x.parameter === "vm")[0];

        const viewModel = vmBinding ? this.evaluateBinding<T>(vmBinding, ctx, element) as Rx.Observable<T> : Rx.Observable.of(undefined);
        const params = {};
        bindings.filter(x => x.parameter !== undefined).forEach(x => params[<string> x.parameter] = x.expression(ctx, element));
        let internal: Rx.Subscription;

        function doCleanup() {
            if (internal) {
                internal.unsubscribe();
            }
        }
        const descriptor = componentName.mergeMap(name => components.load<T>(name));
        const observable = descriptor.combineLatest(viewModel, (desc, vm) => components.initialize(desc, vm, params));

        // subscribe to any input changes
        state.cleanup.add(observable.subscribe(component => {
            doCleanup();
            internal = new Rx.Subscription();
            // isolated nodestate and ctx
            if (component.viewModel) {
                const componentState = this.domManager.nodeState.get<T>(element) || this.domManager.nodeState.create<T>();
                componentState["isolate"] = true;
                componentState.model = component.viewModel;
                this.domManager.nodeState.set(element, componentState);
                ctx = this.domManager.nodeState.getDataContext(element);
                // auto-dispose view-model
                if (isDisposable(component.viewModel)) {
                    internal.add(component.viewModel);
                }
            }
            // done
            this.applyTemplate(element, ctx, state.cleanup, component.template, <T | undefined> component.viewModel);
        }));
        state.cleanup.add(doCleanup);
    }

    protected applyTemplate(element: HTMLElement, ctx: IDataContext, cleanup: Rx.Subscription, template: Node[], vm?: T) {
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

}
