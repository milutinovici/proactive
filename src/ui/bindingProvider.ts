import { BindingAttribute } from "./bindingAttribute";
import { isElement } from "./utils";
import { components } from "./components/registry";

export class BindingProvider {

    public static getBindings(element: Node): BindingAttribute<any>[] {
        if (!isElement(element)) {
             return [this.handleBarsToBinding(element)];
        }
        const bindings = this.getAttributeValues(element);
        const tagName = element.tagName.toLowerCase();
        // check if element is custom element (component)
        if (tagName.indexOf("-") !== -1 && components.isRegistered(tagName)) {
            bindings.push(this.customElementToBinding(element));
        }
        return bindings;
    }

    private static getAttributeValues(element: Element): BindingAttribute<any>[] {
        const bindings: BindingAttribute<any>[] = [];
        const tagName = element.tagName.toLowerCase();
        for (let i = 0; i < element.attributes.length; i++) {
            if (element.attributes[i].name.indexOf("x-") === 0) {
                const array = element.attributes[i].name.split("-");
                bindings.push(new BindingAttribute<any>(tagName, array[1], element.attributes[i].value, array.slice(2, array.length).join("-") || undefined));
            }
        }
        return bindings;
    }

    private static customElementToBinding(element: Element): BindingAttribute<string> {
        // when a component is referenced as custom-element, apply a virtual 'component' binding
        const tagName = element.tagName.toLowerCase();
        return new BindingAttribute<string>(tagName, "component", `'${tagName}'`);
    }

    private static handleBarsToBinding(node: Node): BindingAttribute<string> {
        const trimmed = (node.nodeValue as string).trim();
        const expression = trimmed.slice(2, trimmed.length - 2);
        return new BindingAttribute<string>("text", "text", expression);
    }
}
