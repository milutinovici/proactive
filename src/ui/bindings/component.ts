import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { isDisposable } from "../utils";
import { INodeState, IDataContext, IComponent } from "../interfaces";
import { BindingBase } from "./bindingBase";
import { exception } from "../exceptionHandlers";
import { components } from "../components/registry";

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

        const obs = componentName.mergeMap<IComponent<T>>(name => {
            const component: Rx.Observable<IComponent<T>> = components.load<T>(name, componentParams);
            if (component == null) {
                exception.next(new Error(`component '${name}' is not registered with current module-context`));
            }
            return component;
        });

        // subscribe to any input changes
        state.cleanup.add(obs.subscribe(component => {
            doCleanup();
            internal = new Rx.Subscription();
            // isolated nodestate and ctx
            if (component.viewModel) {
                const componentState = this.domManager.nodeState.get<T>(element) || this.domManager.nodeState.create();
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

    private getParams(element: HTMLElement, ctx: IDataContext, state: INodeState<string>): Object {
        const attributes = state.params;
        const params = {};
        attributes.forEach(x => {
                params[x.name] = x.expression(ctx, element);
            });
        return params;
    }
}
