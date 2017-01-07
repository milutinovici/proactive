import { Observable, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { isRxObservable } from "../utils";
import { INodeState, IDataContext, IComponentDescriptor, IComponent, IViewModel } from "../interfaces";
import { SingleBindingBase } from "./bindingBase";
import { AttrBinding } from "./oneWay";
import { components } from "../components/registry";

export class ComponentBinding<T> extends SingleBindingBase<string> {
    public priority = 30;
    public controlsDescendants = true;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applySingleBinding(element: HTMLElement, observable: Observable<string>, state: INodeState, ctx: IDataContext) {
        const descriptor = observable.mergeMap(name => components.load(name));
        const params = this.getParams(state, ctx);
        const viewModel = this.getViewModel(element, state, ctx, descriptor, params);
        const component = descriptor.combineLatest(viewModel, (desc, vm) => <IComponent> { template: desc.template, viewModel: vm });

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
                const componentState = this.domManager.nodeState.get(element) || this.domManager.nodeState.create(comp.viewModel);
                componentState.isolate = true;
                componentState.model = comp.viewModel;
                this.domManager.nodeState.set(element, componentState);
                ctx = this.domManager.nodeState.getDataContext(element);

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
                            attrHandler.apply(element, attributes[prop], prop);
                        }
                    });
                }
                // auto-dispose view-model
                if (comp.viewModel.cleanup !== undefined) {
                    internal.add(comp.viewModel.cleanup);
                }
            }

            // done
            this.applyTemplate(element, ctx, state.cleanup, comp.template, comp.viewModel);
        }));
        state.cleanup.add(doCleanup);
    }

    protected applyTemplate(element: HTMLElement, ctx: IDataContext, cleanup: Subscription, template: Node[], vm?: IViewModel) {
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

    private getParams(state: INodeState, ctx: IDataContext): T {
        const params = {};
        if (state.bindings["attr"] !== undefined) {
            state.bindings["attr"].filter(x => x.parameter !== undefined).forEach(x => params[<string> x.parameter] = x.expression(ctx));
        }
        return params as T;
    }

    private getViewModel(element: HTMLElement, state: INodeState, ctx: IDataContext, descriptor: Observable<IComponentDescriptor>, params: T): Observable<IViewModel|null> {
        return state.bindings["with"] ?
               state.bindings["with"][0].evaluate(ctx, element, false) as Observable<IViewModel> :
               descriptor.map(x => components.initialize(x, params));
    }
}
