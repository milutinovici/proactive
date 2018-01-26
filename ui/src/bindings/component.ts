import { Observable, Subscription } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { DomManager } from "../domManager";
import { isObservable } from "../utils";
import { INodeState, IComponent, IScope, IBinding } from "../interfaces";
import { Scope } from "../nodeState";
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

    public applyInternal(element: HTMLElement, binding: IBinding<string | object>, state: INodeState, shadowDom = false): void {
        // remove children for transclusion
        const children = this.engine.createFragment();
        this.domManager.applyBindingsToDescendants(state.scope, element);
        while (element.firstChild) {
            children.appendChild(element.removeChild(element.firstChild));
        }

        // enable shadow-dom
        const host = element;
        if (element.attachShadow !== undefined && shadowDom) {
            element.attachShadow({ mode: "open" });
            element = element.shadowRoot as any;
        }

        const component = this.getComponent(element, binding, state);
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
            internal.add(() => {
                this.domManager.cleanDescendants(element);
                while (element.firstChild) {
                    element.removeChild(element.firstChild);
                }
            });
            // isolated nodestate and scope
            const scope = new Scope(comp.viewModel);

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

            this.applyTemplate(element, scope, comp, children);
        }));
        binding.cleanup.add(doCleanup);
    }
    protected getComponent(element: Element, binding: IBinding<string|object>, state: INodeState): Observable<IComponent> {
        const config = binding.evaluate(state.scope, this.dataFlow) as Observable<string | object>;
        const props = this.getProps(element, state);
        return config.pipe(mergeMap(cfg => {
            const name = typeof (cfg) === "string" ? cfg : cfg["name"];
            // object is useful for routes
            Object.assign(props, cfg);
            return this.registry.load(name).pipe(map(desc => {
                const vm = this.registry.initialize(desc, props, this.getVm(state));
                return { viewModel: vm, template: desc.template } as IComponent;
            }));
        }));
    }
    protected applyTemplate(parent: HTMLElement, childScope: IScope, component: IComponent, boundChildren: DocumentFragment) {
        // invoke preBindingInit
        if (component.viewModel.hasOwnProperty("preInit")) {
            component.viewModel.preInit(parent, childScope);
        }
        // apply bindings to component template
        const inner = component.template.cloneNode(true) as Element;
        this.domManager.applyBindingsToDescendants(childScope, inner);

        // transclusion
        const slots = Array.from(inner.querySelectorAll("slot"));
        if (slots.length > 0 && boundChildren.childNodes.length) {
            const slotParent = slots[0].parentNode as Node;
            slotParent.insertBefore(boundChildren, slots[0]);
            slotParent.removeChild(slots[0]);
        }

        parent.appendChild(inner);
        // invoke postBindingInit
        if (component.viewModel.hasOwnProperty("postInit")) {
            component.viewModel.postInit(parent, childScope);
        }
    }

    private getProps(element: Element, state: INodeState): T {
        const props = {} as T;
        const attrBindings = state.getBindings<any>("attr");
        attrBindings.forEach(x => props[x.parameter as string] = x.expression(state.scope));
        Object.assign(props, state.constantProps);
        return props;
    }
    // for recursive components
    private getVm(state: INodeState): T | undefined {
        const vm = state.getBindings<T>("attr").filter(x => x.parameter === "vm")[0];
        if (vm !== undefined) {
            return vm.expression(state.scope) as T;
        }
        return undefined;
    }
}
