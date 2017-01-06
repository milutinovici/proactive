import { BindingAttribute } from "./bindingAttribute";
import { isElement, groupBy, Group } from "./utils";
import { components } from "./components/registry";

const bindingPrefix = /^x-/;

export class BindingProvider {

    public getBindings(element: Element): Group<BindingAttribute<any>> {
        if (!isElement(element)) {
             throw new Error("Only html elements can have bindings");
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
            return new BindingAttribute(element.tagName.toLowerCase(), array[1], x.value, array.slice(2, array.length).join("-") || undefined);
        });
    }

    private customElementToBinding(element: Element): BindingAttribute<any> {
        // when a component is referenced as custom-element, apply a virtual 'component' binding
        const tagName = element.tagName.toLowerCase();
        return new BindingAttribute(tagName, "component", `'${tagName}'`);
    }

}
