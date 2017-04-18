import { IBindingHandler, IBinding } from "./interfaces";
import { Binding } from "./binding";
import { isElement } from "./utils";
import { components } from "./components/registry";
import { exception } from "./exceptionHandlers";
export class BindingProvider {
    private static readonly handlers = new Map<string, IBindingHandler>();

    public static registerHandler(handler: IBindingHandler) {
        this.handlers.set(handler.name, handler);
    }

    public static getBindings(element: Node): IBinding<any>[] {
        if (!isElement(element)) {
             return [this.handleBarsToBinding(element)];
        }
        const tag = element.tagName;
        const bindings = element.hasAttributes() ? this.getBindingAttributes(element, tag) : [];
        // check if element is custom element (component)
        if (components.registered(tag)) {
            // when a component is referenced as custom-element, apply a virtual 'component' binding
            bindings.push(new Binding<string>(BindingProvider.handlers.get("component") as IBindingHandler, `'${tag}'`));
        }
        return bindings;
    }

    private static getBindingAttributes(element: Element, tag: string): IBinding<any>[] {
        let controlsDescendants = 0;
        const bindings: Binding<any>[] = [];
        for (let i = 0; i < element.attributes.length; i++) {
            const attribute = element.attributes[i];
            const array = attribute.name.split("-");
            if (array[0] === "x") {
                array.shift();
                const name = array.shift() as string;
                const handler = BindingProvider.handlers.get(name);
                if (!handler) {
                    exception.next(new Error(`Binding handler "${name}" has not been registered.`));
                } else {
                    bindings.push(new Binding<any>(handler, attribute.value, array.join("-") || undefined));
                    if (handler.controlsDescendants) {
                        controlsDescendants += 1;
                    }
                }
            }
        }
        if (controlsDescendants > 1) {
            throw Error(`bindings are competing for descendants of target element!`);
        }
        bindings.sort((a, b) => b.handler.priority - a.handler.priority);
        return bindings;
    }

    private static handleBarsToBinding(node: Node): Binding<string> {
        const trimmed = (node.nodeValue as string).trim();
        const expression = trimmed.slice(2, trimmed.length - 2);
        return new Binding<string>(BindingProvider.handlers.get("text") as IBindingHandler, expression, expression);
    }
}
