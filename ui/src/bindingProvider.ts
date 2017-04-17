import { IBindingHandler, IBindingAttribute } from "./interfaces";
import { BindingAttribute } from "./bindingAttribute";
import { isElement } from "./utils";
import { components } from "./components/registry";
import { exception } from "./exceptionHandlers";
export class BindingProvider {
    private static readonly bindingHandlers = new Map<string, IBindingHandler>();

    public static registerHandler(handler: IBindingHandler) {
        this.bindingHandlers.set(handler.name, handler);
    }
    public static getBindingHandler(name: string) {
        const handler = this.bindingHandlers.get(name);
        if (!handler) {
            throw new Error(`Binding handler "${name}" has not been registered.`);
        }
        return handler;
    }
    public static getHandlers(bindings: Map<string, IBindingAttribute<any>[]>, handlers: IBindingHandler[]) {
        let controlsDescendants = 0;
        bindings.forEach((val, name) => {
            const handler = this.bindingHandlers.get(name);
            if (!handler) {
                exception.next(new Error(`Binding handler "${name}" has not been registered.`));
            } else {
                if (handler.controlsDescendants) {
                    controlsDescendants += 1;
                }
                handlers.push(handler);
            }
        });
        // sort by priority
        handlers.sort((a, b) => b.priority - a.priority);

        if (controlsDescendants > 1) {
            throw Error(`bindings are competing for descendants of target element!`);
        }
        return controlsDescendants;
    }

    public static getBindings(element: Node): BindingAttribute<any>[] {
        if (!isElement(element)) {
             return [this.handleBarsToBinding(element)];
        }
        const tag = element.tagName;
        const bindings = element.hasAttributes() ? this.getAttributeValues(element, tag) : [];
        // check if element is custom element (component)
        if (components.registered(tag)) {
            // when a component is referenced as custom-element, apply a virtual 'component' binding
            bindings.push(new BindingAttribute<string>(tag, "component", `'${tag}'`));
        }
        return bindings;
    }

    private static getAttributeValues(element: Element, tag: string): BindingAttribute<any>[] {
        const bindings: BindingAttribute<any>[] = [];
        for (let i = 0; i < element.attributes.length; i++) {
            const attribute = element.attributes[i];
            const array = attribute.name.split("-");
            if (array[0] === "x") {
                array.shift();
                const binding = array.shift() as string;
                bindings.push(new BindingAttribute<any>(tag, binding , attribute.value, array.join("-") || undefined));
            }
        }
        return bindings;
    }

    private static handleBarsToBinding(node: Node): BindingAttribute<string> {
        const trimmed = (node.nodeValue as string).trim();
        const expression = trimmed.slice(2, trimmed.length - 2);
        return new BindingAttribute<string>("text", "text", expression, expression);
    }
}
