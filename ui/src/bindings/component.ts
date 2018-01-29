import { Observable, Subscription } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { DomManager } from "../domManager";
import { isObservable, isElement, removeEmptyChildren } from "../utils";
import { INodeState, IComponent, IScope, IBinding } from "../interfaces";
import { Scope } from "../nodeState";
import { BaseHandler } from "./baseHandler";
import { ComponentRegistry } from "../componentRegistry";
import { HtmlEngine } from "../templateEngines";
import { exception } from "../exceptionHandlers";

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
        const children: Node[] = [];
        removeEmptyChildren(element);

        // bind children using parent (not component) scope
        this.domManager.applyBindingsToDescendants(state.scope, element);
        while (element.firstChild) {
            children.push(element.removeChild(element.firstChild));
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
    private getComponent(element: Element, binding: IBinding<string|object>, state: INodeState): Observable<IComponent> {
        const config = binding.evaluate(state.scope, this.dataFlow) as Observable<string | object>;
        const props = this.getProps(element, state);
        return config.pipe(mergeMap(cfg => {
            const isObj = typeof (cfg) !== "string";
            const name = isObj  ? cfg["name"] : cfg;
            if (isObj) {
                // object is useful for routes
                Object.assign(props, cfg);
            }
            return this.registry.load(name).pipe(map(desc => {
                const vm = this.registry.initialize(name, desc, props, this.getVm(state));
                return { viewModel: vm, template: desc.template, name: name } as IComponent;
            }));
        }));
    }
    private getProps(element: Element, state: INodeState): T {
        const props = {} as T;
        const attrBindings = state.getBindings<any>("attr");
        attrBindings.forEach(x => props[x.parameters[0] as string] = x.expression(state.scope));
        Object.assign(props, state.constantProps);
        return props;
    }
    // for recursive components
    private getVm(state: INodeState): T | undefined {
        const vm = state.getBindings<T>("attr").filter(x => x.parameters[0] === "vm")[0];
        if (vm !== undefined) {
            return vm.expression(state.scope) as T;
        }
        return undefined;
    }
    protected applyTemplate(parent: HTMLElement, childScope: IScope, component: IComponent, boundChildren: Node[]) {
        // invoke preBindingInit
        if (component.viewModel.hasOwnProperty("preInit")) {
            component.viewModel.preInit(parent, childScope);
        }

        const template = component.template.cloneNode(true) as DocumentFragment;
        this.domManager.applyBindingsToDescendants(childScope, template);

        if (boundChildren.length) {
            this.transclude(component.name, template, boundChildren);
        }
        parent.appendChild(template);
        // invoke postBindingInit
        if (component.viewModel.hasOwnProperty("postInit")) {
            component.viewModel.postInit(parent, childScope);
        }
    }
    private transclude(name: string, boundTemplate: DocumentFragment, boundChildren: Node[]) {
        const slots = Array.from(boundTemplate.querySelectorAll("slot"));
        if (slots.length === 0) {
            exception.next(new Error(`Component ${name} doesn't have a slot defined, but was passed ${boundChildren}`));
        } else {
            const defaultSlot = slots.find(x => !x.hasAttribute("name")) || slots[0];
            for (const child of boundChildren) {
                if (isElement(child) && child.hasAttribute("slot")) {
                    const attr = child.attributes.getNamedItem("slot");
                    const slot = slots.find(st => st.getAttribute("name") === attr.value);
                    if (slot === undefined) {
                        exception.next(new Error(`Component ${name} doesn't have a slot with a name ${attr.value} defined`));
                    } else {
                        const slotParent = slot.parentNode as Node;
                        slotParent.insertBefore(child, slot);
                        slotParent.removeChild(slot);
                    }
                } else {
                    const slotParent = defaultSlot.parentNode as Node;
                    slotParent.insertBefore(child, defaultSlot);
                }
            }
            const slotParent = defaultSlot.parentNode as Node;
            slotParent.removeChild(defaultSlot);
        }
    }
}
