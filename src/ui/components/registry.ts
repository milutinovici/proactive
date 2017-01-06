import * as Rx from "rxjs";
import { IComponentDescriptor, IViewModel } from "../interfaces";
import { observableRequire, isFunction, nodeListToArray } from "../utils";
import { html } from "../templateEngines";
import { exception } from "../exceptionHandlers";
export class ComponentRegistry {

    private readonly components: { [name: string]: IComponentDescriptor<any> | string } = {};

    // component is either a descriptor or a require string
    public register<T>(name: string, component: IComponentDescriptor<T> | string) {
        if (name.indexOf("-") === -1) {
            throw new Error(`Component name "${name}" must contain a dash (-)` );
        }
        this.components[name] = component;
    }

    public isRegistered(name: string): boolean {
        return this.components[name] != null;
    }

    public load<T>(name: string): Rx.Observable<IComponentDescriptor<T>> {
        let result = this.getDescriptor<T>(name);
        result = result.map(x => <IComponentDescriptor<T>> { name: name, template: this.compileTemplate(x.template), viewModel: x.viewModel });
        result.do(x => this.components[name] = x ); // cache descriptor
        return result;
    }

    private getDescriptor<T>(name: string): Rx.Observable<IComponentDescriptor<T>> {
        const descriptor = this.components[name];
        if (descriptor != null) {
            if (typeof descriptor === "string") {
                return observableRequire<IComponentDescriptor<T>>(descriptor);
            } else {
                return Rx.Observable.of<IComponentDescriptor<T>>(descriptor);
            }
        } else {
            throw new Error(`No component with name '${name}' is registered`);
        }
    }

    public initialize<T extends Object>(descriptor: IComponentDescriptor<T>, params: T): IViewModel<T> | null {
        let vm = descriptor.viewModel || null;
        if (isFunction(vm)) {
            let model: IViewModel<T> | null = null;
            try {
                model = new vm(params);
            } catch (e) {
                exception.next(new Error(`Failed in constructor of component "${descriptor.name}". ${e.message}`));
            }
            return model;
        }
        return vm;
    }

    private compileTemplate(template: Node[] | string): Node[] {
        if (typeof template === "string") {
            if (template[0] === "#") {
                const tmp = document.getElementById(template.slice(1, template.length));
                if (tmp instanceof HTMLTemplateElement) {
                    return nodeListToArray(tmp.content.childNodes);
                } else if (tmp !== null) {
                    return nodeListToArray(tmp.childNodes);
                } else {
                    throw Error(`No template with id: "${template}" found`);
                }
            } else {
                return html.parse(template);
            }
        } else if (Array.isArray(template)) {
            return <Node[]> template;
        } else { throw Error("invalid template descriptor");
        }
    }

}

export const components: ComponentRegistry = new ComponentRegistry();
