import { IBindingHandler, IBinding } from "./interfaces";
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
    public registerHandler(handler: IBindingHandler) {
        if (!this.handlers.has(handler.name)) {
            this.handlers.set(handler.name, handler);
        } else {
            throw new Error(`Binding handler with "${handler.name}" name is already registered`);
        }
    }

    public getBindingsAndProps(element: Node): [IBinding<any>[], object] {
        if (!isElement(element)) {
             return [[this.handleBarsToBinding(element)], {}];
        }
        const tag = element.tagName;
        const bindings: Binding<any>[] = [];
        let controlsDescendants = 0;

        // check if element is custom element (component)
        if (this.components.registered(tag)) {
            // when a component is referenced as custom-element, apply a virtual 'component' binding
            bindings.push(new Binding<string>(this.handlers.get("component") as IBindingHandler, `'${tag}'`));
            controlsDescendants += 1;
        }
        const props = {};
        if (element.hasAttributes()) {
            for (let i = 0; i < element.attributes.length; i++) {
                const binding = this.attributeToBindingOrProp(element.attributes[i]);
                if (!Array.isArray(binding)) {
                    bindings.push(binding);
                    if (binding.handler.controlsDescendants) {
                        controlsDescendants += 1;
                    }
                } else {
                    props[binding[0]] = binding[1];
                }
            }
        }
        if (controlsDescendants > 1) {
            throw Error(`bindings are competing for descendants of target element!`);
        }
        bindings.sort((a, b) => b.handler.priority - a.handler.priority);

        return [bindings, props];
    }

    private attributeToBindingOrProp(attribute: Attr): Binding<any> | [string, string|boolean|number] {
        const attrName = attribute.name;
        if (attrName[0] === BindingProvider.PREFIX) {
            const array = attribute.name.split("-");
            array.shift();
            const name = array.shift() as string;
            const handler = this.handlers.get(name);
            if (!handler) {
                exception.next(new Error(`Binding handler "${name}" has not been registered.`));
                return [attrName, attribute.value];
            } else {
                return new Binding<any>(handler, attribute.value, array.join("-") || undefined);
            }
        } else if (attrName[0] === BindingProvider.ATTR) {
            const handler = this.handlers.get("attr") as IBindingHandler;
            return new Binding<any>(handler, attribute.value, attrName.substring(1));
        } else if (attrName[0] === BindingProvider.ON) {
            const handler = this.handlers.get("on") as IBindingHandler;
            return new Binding<any>(handler, attribute.value, attrName.substring(1));
        } else {
            return [attrName, attribute.value === "" ? true : tryParse(attribute.value)];
        }
    }

    private handleBarsToBinding(node: Node): Binding<string> {
        const trimmed = (node.nodeValue as string).trim();
        const expression = trimmed.slice(2, trimmed.length - 2);
        return new Binding<string>(this.handlers.get("text") as IBindingHandler, expression, expression);
    }
}
