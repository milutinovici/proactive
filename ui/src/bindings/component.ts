import { Observable, Subscription } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { DomManager } from "../domManager";
import { isObservable } from "../utils";
import { INodeState, IComponent, IDataContext, IBinding } from "../interfaces";
import { DataContext } from "../nodeState";
import { BaseHandler } from "./baseHandler";
import { ComponentRegistry } from "../componentRegistry";
import { HtmlEngine } from "../templateEngines";

export class ComponentBinding<T> extends BaseHandler<string|object> {
    private readonly domManager: DomManager;
    protected readonly registry: ComponentRegistry;
    private readonly engine: HtmlEngine;
    constructor(name: string, domManager: DomManager, engine: HtmlEngine, registry: ComponentRegistry) {
        super(name);
        this.priority = 20;
        this.unique = true;
        this.controlsDescendants = true;
        this.domManager = domManager;
        this.registry = registry;
        this.engine = engine;
    }

    public applyInternal(element: HTMLElement, binding: IBinding<string|object>, state: INodeState, shadowDom = false): void {
        const host = element;
        if (element.attachShadow !== undefined && shadowDom) {
            element.attachShadow({ mode: "open" });
            element = element.shadowRoot as any;
        }
        const component = this.getComponent(element, binding, state);
        // transclusion
        const children = this.engine.createFragment();
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
                if (comp.viewModel.emitter !== undefined && isObservable(comp.viewModel.emitter)) {
                    internal.add(comp.viewModel.emitter.subscribe(evt => host.dispatchEvent(evt)));
                }
                // apply custom component value
                if (comp.viewModel.value !== undefined && isObservable(comp.viewModel.value)) {
                    internal.add(comp.viewModel.value.subscribe(val => {
                        host["value"] = val;
                        const evt = this.engine.createEvent("change");
                        host.dispatchEvent(evt);
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
    protected getComponent(element: Element, binding: IBinding<string|object>, state: INodeState): Observable<IComponent> {
        const config = binding.evaluate(state.context, this.dataFlow) as Observable<string | object>;
        const props = this.getProps(element, state);
        return config.pipe(mergeMap(cfg => {
            const name = typeof (cfg) === "string" ? cfg : cfg["name"];
            // object is useful for routes
            Object["assign"](props, cfg);
            return this.registry.load(name).pipe(map(desc => {
                const vm = this.registry.initialize(desc, props, this.getVm(state));
                return { viewModel: vm, template: desc.template } as IComponent;
            }));
        }));
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

    private getProps(element: Element, state: INodeState): T {
        const props = {} as T;
        const attrBindings = state.getBindings<any>("attr");
        attrBindings.forEach(x => props[x.parameter as string] = x.expression(state.context));
        Array.from(element.attributes).forEach(x => {
            if (props[x.name] === undefined) {
                props[x.name] = x.value;
            }
        });
        return props;
    }
    private getVm(state: INodeState): T | undefined {
        const vm = state.getBindings<T>("attr").filter(x => x.parameter === "vm")[0];
        if (vm !== undefined) {
            return vm.expression(state.context) as T;
        }
        return undefined;
    }
}
