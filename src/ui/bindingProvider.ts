import { BindingAttribute } from "./bindingAttribute";
import { isElement } from "./utils";
import { components } from "./components/registry";

export class BindingProvider {

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
        return new BindingAttribute<string>("text", "text", expression);
    }
}
