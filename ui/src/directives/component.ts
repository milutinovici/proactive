import { Observable, Subscription, isObservable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { DomManager } from "../domManager";
import { isElement, removeEmptyChildren } from "../utils";
import { INodeState, IComponent, IScope, IDirective } from "../interfaces";
import { Scope } from "../nodeState";
import { BaseHandler } from "./baseHandler";
import { ComponentRegistry } from "../componentRegistry";
import { HtmlEngine } from "../templateEngines";
import { exception } from "../exceptionHandlers";

export class ComponentDirective<T> extends BaseHandler<string|object> {
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

    public applyInternal(element: HTMLElement, directive: IDirective<string | object>, state: INodeState, shadowDom = false): void {
        // remove children for transclusion
        const children: Node[] = [];
        removeEmptyChildren(element);

        // bind children using parent (not component) scope
        this.domManager.applyDirectivesToDescendants(element, state.scope);
        while (element.firstChild) {
            children.push(element.removeChild(element.firstChild));
        }

        // enable shadow-dom
        const host = element;
        if (element.attachShadow !== undefined && shadowDom) {
            element.attachShadow({ mode: "open" });
            element = element.shadowRoot as any;
        }

        const component = this.getComponent(element, directive, state);
        let internal: Subscription;
        function doCleanup() {
            if (internal) {
                internal.unsubscribe();
            }
        }

        // subscribe to any input changes
        directive.cleanup.add(component.subscribe(comp => {
            doCleanup();
            internal = new Subscription();

            // isolated nodestate and scope
            const scope = new Scope(comp.viewmodel);

            // wire custom events
            if (comp.viewmodel.emitter !== undefined && isObservable(comp.viewmodel.emitter)) {
                internal.add(comp.viewmodel.emitter.subscribe(evt => host.dispatchEvent(evt)));
            }
            // apply custom component value
            if (comp.viewmodel.value !== undefined && isObservable(comp.viewmodel.value)) {
                internal.add(comp.viewmodel.value.subscribe(val => {
                    host["value"] = val;
                    const evt = this.engine.createEvent("change");
                    host.dispatchEvent(evt);
                }));
            }
            // auto-dispose view-model
            if (comp.viewmodel.cleanup !== undefined) {
                internal.add(comp.viewmodel.cleanup);
            }

            this.applyTemplate(element, scope, comp, children);
            // created lifecycle hook
            if (comp.created !== undefined) {
                comp.created(element, scope);
            }

            internal.add(() => {
                if (comp.destroy !== undefined) {
                    comp.destroy(element, scope);
                }
                this.domManager.cleanDescendants(element);
                while (element.firstChild) {
                    element.removeChild(element.firstChild);
                }
            });
        }));
        directive.cleanup.add(doCleanup);
    }
    private getComponent(element: Element, directive: IDirective<string|object>, state: INodeState): Observable<IComponent> {
        const config = directive.evaluate(state.scope, this.dataFlow) as Observable<string | object>;
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
                return { name: name, viewmodel: vm, template: desc.template, created: desc.created, destroy: desc.destroy} as IComponent;
            }));
        }));
    }
    private getProps(element: Element, state: INodeState): T {
        const props = {} as T;
        const attrDirectives = state.getDirectives<any>("attr");
        attrDirectives.forEach(x => props[x.parameters[0] as string] = x.expression(state.scope));
        Object.assign(props, state.constantProps);
        return props;
    }
    // for recursive components
    private getVm(state: INodeState): T | undefined {
        const vm = state.getDirectives<T>("attr").filter(x => x.parameters[0] === "vm")[0];
        if (vm !== undefined) {
            return vm.expression(state.scope) as T;
        }
        return undefined;
    }
    protected applyTemplate(parent: HTMLElement, childScope: IScope, component: IComponent, boundChildren: Node[]) {
        const template = component.template.content.cloneNode(true) as DocumentFragment;
        this.domManager.applyDirectivesToDescendants(template, childScope);

        if (boundChildren.length) {
            this.transclude(component.name, template, boundChildren);
        }
        parent.appendChild(template);
    }
    private transclude(name: string, boundTemplate: DocumentFragment, boundChildren: Node[]) {
        const slots = Array.from(boundTemplate.querySelectorAll("slot"));
        if (slots.length === 0) {
            exception.next(new Error(`Component ${name} doesn't have a slot defined, but was passed ${boundChildren}`));
        } else {
            const defaultSlot = slots.find(x => !x.hasAttribute("name")) || slots[0];
            for (const child of boundChildren) {
                if (isElement(child) && child.hasAttribute("slot")) {
                    const attr = child.attributes.getNamedItem("slot") as Attr;
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
