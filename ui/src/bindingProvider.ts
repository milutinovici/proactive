import { IBindingHandler, IBinding, INodeState } from "./interfaces";
import { NodeState } from "./nodeState";
import { Binding } from "./binding";
import { isElement, tryParse } from "./utils";
import { ComponentRegistry } from "./componentRegistry";
import { exception } from "./exceptionHandlers";

export class BindingProvider {
    public static readonly PREFIX = "x";
    public static readonly ATTR = ":";
    public static readonly ON = "@";
    private readonly handlers: Map<string, IBindingHandler>;
    private readonly components: ComponentRegistry;
    constructor(components: ComponentRegistry) {
        this.components = components;
        this.handlers = new Map<string, IBindingHandler>();
    }
    public register(handler: IBindingHandler) {
        if (!this.handlers.has(handler.name)) {
            this.handlers.set(handler.name, handler);
        } else {
            throw new Error(`Binding handler with "${handler.name}" name is already registered`);
        }
    }

    public createNodeState(node: Node): NodeState | null {
        const isEl = isElement(node);
        if (!isEl) {
            return new NodeState([this.handleBarsToBinding(node)], {});
        }
        const tag = node["tagName"];
        const isCustomElement = this.components.registered(tag);
        if (!isCustomElement && !node.hasAttributes()) {
            return null;
        }
        const state = new NodeState([], {});
        if (isCustomElement) {
            // when a component is referenced as custom-element, apply a virtual 'component' binding
            state.bindings.push(new Binding<string>(this.handlers.get("component") as IBindingHandler, `'${tag}'`, []));
            state.controlsDescendants += 1;
        }
        for (let i = 0; i < node.attributes.length; i++) {
            const binding = this.attributeToBindingOrProp(node.attributes[i]);
            if (!Array.isArray(binding)) {
                state.bindings.push(binding);
                if (binding.handler.controlsDescendants) {
                    state.controlsDescendants += 1;
                }
            } else {
                state.constantProps[binding[0]] = binding[1];
            }
        }
        state.bindings.sort((a: IBinding<any>, b: IBinding<any>) => b.handler.priority - a.handler.priority);
        return state;
    }

    private attributeToBindingOrProp(attribute: Attr): Binding<any> | [string, string|boolean|number] {
        const attrName = attribute.name;
        if (attrName[0] === BindingProvider.PREFIX && attrName[1] === "-") {
            const array = attrName.slice(2).split(":");
            const name = array.shift() as string;
            const handler = this.handlers.get(name);
            if (!handler) {
                exception.next(new Error(`Binding handler "${name}" has not been registered.`));
                return [attrName, attribute.value];
            } else {
                return new Binding<any>(handler, attribute.value, array);
            }
        } else if (attrName[0] === BindingProvider.ATTR) {
            const handler = this.handlers.get("attr") as IBindingHandler;
            return new Binding<any>(handler, attribute.value, [attrName.substring(1)]);
        } else if (attrName[0] === BindingProvider.ON) {
            const handler = this.handlers.get("on") as IBindingHandler;
            return new Binding<any>(handler, attribute.value, [attrName.substring(1)]);
        } else {
            return [attrName, attribute.value === "" ? true : tryParse(attribute.value)];
        }
    }

    private handleBarsToBinding(node: Node): Binding<string> {
        const trimmed = (node.nodeValue as string).trim();
        const expression = trimmed.slice(2, trimmed.length - 2);
        return new Binding<string>(this.handlers.get("text") as IBindingHandler, expression, [expression]);
    }
}
