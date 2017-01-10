import { BindingAttribute } from "./bindingAttribute";
import { isElement, groupBy, Group } from "./utils";
import { components } from "./components/registry";

const bindingPrefix = /^x-/;

export class BindingProvider {

    public getBindings(element: Node): Group<BindingAttribute<any>> {
        if (!isElement(element)) {
             return groupBy([this.handleBarsToBinding(element)], x => x.name);
        }
        const bindings = this.getAttributeValues(element, bindingPrefix);
        const tagName = element.tagName.toLowerCase();
        // check if element is custom element (component)
        if (tagName.indexOf("-") !== -1 && components.isRegistered(tagName)) {
            bindings.push(this.customElementToBinding(element));
        }
        return groupBy(bindings, x => x.name);
    }

    private getAttributeValues(element: Element, prefix: RegExp): BindingAttribute<any>[] {

        const attributes: Attr[] = [].filter.call(element.attributes, (at: Attr) => prefix.test(at.name));
        return attributes.map(x => {
            const array = x.name.split("-");
            return new BindingAttribute<any>(element.tagName.toLowerCase(), array[1], x.value, array.slice(2, array.length).join("-") || undefined);
        });
    }

    private customElementToBinding(element: Element): BindingAttribute<string> {
        // when a component is referenced as custom-element, apply a virtual 'component' binding
        const tagName = element.tagName.toLowerCase();
        return new BindingAttribute<string>(tagName, "component", `'${tagName}'`);
    }

    private handleBarsToBinding(node: Node): BindingAttribute<string> {
        const trimmed = (node.nodeValue as string).trim();
        const expression = trimmed.slice(2, trimmed.length - 2);
        return new BindingAttribute<string>("text", "text", expression);
    }
}
