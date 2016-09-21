import { DomManager } from "../domManager";
import { isDisposable } from "../utils";
import { INodeState, IDataContext, IComponentDescriptor } from "../interfaces";
import { BindingBase } from "./bindingBase";
import * as Rx from "rxjs";
import { app } from "../app";
import { exception } from "../exceptionHandlers";

export default class ComponentBinding<T> extends BindingBase<string> {
    public priority = 30;
    public controlsDescendants = true;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyBindingInternal(element: HTMLElement, componentName: Rx.Observable<string>, ctx: IDataContext, state: INodeState<string>): void {
        const componentParams = this.getParams(element, ctx, state);
        let internal: Rx.Subscription;

        function doCleanup() {
            if (internal) {
                internal.unsubscribe();
            }
        }

        const obs = componentName.mergeMap(name => {
            const component = app.components.load<T>(name, componentParams);
            if (component == null) {
                exception.next(new Error(`component '${componentName}' is not registered with current module-context`));
            }
            return component;
        });

        // subscribe to any input changes
        state.cleanup.add(obs.subscribe(component => {
            doCleanup();
            internal = new Rx.Subscription();
            // isolated nodestate and ctx
            if (component.viewModel) {
                const componentState = this.domManager.nodeState.get<T>(element);
                componentState["isolate"] = true;
                componentState.model = component.viewModel;
                ctx = this.domManager.getDataContext(element);
                // auto-dispose view-model
                if (isDisposable(component.viewModel)) {
                    const sub = <Rx.Subscription> component.viewModel;
                    internal.add(sub);
                }
            }
            // done
            this.applyTemplate(component, element, ctx, state.cleanup, component.template, component.viewModel);
        }));
        state.cleanup.add(doCleanup);
    }

    protected applyTemplate(component: IComponentDescriptor<T>, element: HTMLElement, ctx: IDataContext, cleanup: Rx.Subscription, template: Node[], vm?: T) {
        if (template) {
            // clear
            while (element.firstChild) {
                this.domManager.cleanNode(<HTMLElement> element.firstChild);
                element.removeChild(element.firstChild);
            }
            // clone template and inject
            for (let i = 0; i < template.length; i++) {
                const node = template[i].cloneNode(true);
                element.appendChild(node);
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

    private getParams(element: HTMLElement, ctx: IDataContext, state: INodeState<string>): any {
        const attributes = state.params;
        const params = {};
        attributes.forEach(x => {
                params[x.name] = x.expression(ctx, element);
            });
        return params;
    }
}
