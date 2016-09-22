import { IBindingAttribute, IBindingHandler } from "./interfaces";
import { compileBindingExpression } from "./expressionCompiler";
import { isElement } from "./utils";
import * as app from "./ui";

const bindingPrefix = /^bind-/;
const parameterPrefix = /^param-/;

export class BindingProvider {

    public getBindingHandlers(bindings: IBindingAttribute[]) {
        // lookup handlers
        const pairs = bindings.map(x => {
            const handler = app.bindings.getHandler<any>(x.name);

            if (!handler) {
                throw Error(`binding '${x.name}' has not been registered.`);
            }
            return { binding: x, handler: handler };
        });
        // sort by priority
        pairs.sort((a, b) => b.handler.priority - a.handler.priority);

        // check if there's binding-handler competition for descendants (which is illegal)
        const hd = pairs.filter(x => x.handler.controlsDescendants).map(x => `'${x.binding.name}'`);
        if (hd.length > 1) {
            throw Error(`bindings ${hd.join(", ")} are competing for descendants of target element!`);
        }
        return pairs;
    }

    public getParameters(element: HTMLElement): IBindingAttribute[] {
        return this.getAttributeValues(element, parameterPrefix);
    }

    public getBindings(element: HTMLElement): IBindingAttribute[] {
        if (!isElement(element)) {
            throw new Error("Only html elements can have bindings");
        }
        const bindings = this.getAttributeValues(element, bindingPrefix);
        const tagName = element.tagName.toLowerCase();
        if (app.components.isRegistered(tagName)) {
            return bindings.concat([this.customElementToBinding(element)]);
        }
        return bindings;
    }

    private getAttributeValues(element: HTMLElement, prefix: RegExp): IBindingAttribute[] {

        const attributes: Attr[] = [].filter.call(element.attributes, (at: Attr) => prefix.test(at.name));
        return attributes.map(x => {
            const array = x.name.split("-");
            const expression = compileBindingExpression<any>(x.value);
            return { expression: expression, name: array[1], parameter: array.slice(2, array.length).join("-") || undefined };
        });
    }

    private customElementToBinding(element: HTMLElement): IBindingAttribute {
        // when a component is referenced as custom-element, apply a virtual 'component' binding
        const tagName = element.tagName.toLowerCase();
        const expression = compileBindingExpression<any>(`'${tagName}'`);
        return { expression: expression, name: "component" };
    }

}
