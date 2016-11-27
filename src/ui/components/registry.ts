import * as Rx from "rxjs";
import { IComponentDescriptor, IComponent } from "../interfaces";
import { observableRequire, isFunction, nodeListToArray } from "../utils";
import { html } from "../templateEngines";

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

    public load<T>(name: string, params?: Object): Rx.Observable<IComponent<T>> {
        let result = this.getDescriptor<T>(name);
        result = result.map(x => <IComponentDescriptor<T>> { template: this.compileTemplate(x.template), viewModel: x.viewModel });
        result.do(x => this.components[name] = x ); // cache descriptor

        return this.initialize<T>(result, params);
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

    private initialize<T>(obs: Rx.Observable<IComponentDescriptor<T>>, params?: Object): Rx.Observable<IComponent<T>> {
        return obs.take(1).map(descriptor => {
                let vm: any = descriptor.viewModel;
                if (isFunction(vm)) {
                    vm = new vm(params);
                }
                return <IComponent<T>> { template: <Node[]> descriptor.template, viewModel: vm };
            })
            .take(1);
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
