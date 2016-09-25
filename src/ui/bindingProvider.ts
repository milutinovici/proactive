import { IBindingAttribute } from "./interfaces";
import { compileBindingExpression } from "./expressionCompiler";
import { isElement } from "./utils";
import { components } from "./components/registry";

const bindingPrefix = /^bind-/;
const parameterPrefix = /^param-/;

export class BindingProvider {

    public getParameters(element: Element): IBindingAttribute[] {
        return this.getAttributeValues(element, parameterPrefix);
    }

    public getBindings(element: Element): IBindingAttribute[] {
        if (!isElement(element)) {
            throw new Error("Only html elements can have bindings");
        }
        const bindings = this.getAttributeValues(element, bindingPrefix);
        const tagName = element.tagName.toLowerCase();
        // check if element is custom element (component)
        if (tagName.indexOf("-") !== -1 && components.isRegistered(tagName)) {
            return bindings.concat([this.customElementToBinding(element)]);
        }
        return bindings;
    }

    private getAttributeValues(element: Element, prefix: RegExp): IBindingAttribute[] {

        const attributes: Attr[] = [].filter.call(element.attributes, (at: Attr) => prefix.test(at.name));
        return attributes.map(x => {
            const array = x.name.split("-");
            const expression = compileBindingExpression<any>(x.value);
            return { expression: expression, name: array[1], parameter: array.slice(2, array.length).join("-") || undefined };
        });
    }

    private customElementToBinding(element: Element): IBindingAttribute {
        // when a component is referenced as custom-element, apply a virtual 'component' binding
        const tagName = element.tagName.toLowerCase();
        const expression = compileBindingExpression<any>(`'${tagName}'`);
        return { expression: expression, name: "component" };
    }

}
