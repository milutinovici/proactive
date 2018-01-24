import { IBindingHandler, IBinding } from "./interfaces";
import { Binding } from "./binding";
import { isElement } from "./utils";
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

    public getBindings(element: Node): IBinding<any>[] {
        if (!isElement(element)) {
             return [this.handleBarsToBinding(element)];
        }
        const tag = element.tagName;
        const bindings = element.hasAttributes() ? this.getBindingAttributes(element) : [];
        // check if element is custom element (component)
        if (this.components.registered(tag)) {
            // when a component is referenced as custom-element, apply a virtual 'component' binding
            bindings.push(new Binding<string>(this.handlers.get("component") as IBindingHandler, `'${tag}'`));
        }
        return bindings;
    }

    private getBindingAttributes(element: Element): IBinding<any>[] {
        let controlsDescendants = 0;
        const bindings: Binding<any>[] = [];
        for (let i = 0; i < element.attributes.length; i++) {
            const binding = this.attributeToBinding(element.attributes[i]);
            if (binding !== null) {
                bindings.push(binding);
                if (binding.handler.controlsDescendants) {
                    controlsDescendants += 1;
                }
            }
        }
        if (controlsDescendants > 1) {
            throw Error(`bindings are competing for descendants of target element!`);
        }
        bindings.sort((a, b) => b.handler.priority - a.handler.priority);
        return bindings;
    }

    private attributeToBinding(attribute: Attr): Binding<any> | null {
        const attrName = attribute.name;
        if (attrName[0] === BindingProvider.PREFIX) {
            const array = attribute.name.split("-");
            array.shift();
            const name = array.shift() as string;
            const handler = this.handlers.get(name);
            if (!handler) {
                exception.next(new Error(`Binding handler "${name}" has not been registered.`));
                return null;
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
            return null;
        }
    }

    private handleBarsToBinding(node: Node): Binding<string> {
        const trimmed = (node.nodeValue as string).trim();
        const expression = trimmed.slice(2, trimmed.length - 2);
        return new Binding<string>(this.handlers.get("text") as IBindingHandler, expression, expression);
    }
}
