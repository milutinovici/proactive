import * as Rx from "rxjs";
import { IComponentDescriptor, IComponent } from "../interfaces";
import { observableRequire, isFunction, isRxObservable, nodeListToArray } from "../utils";
import HtmlTemplateEngine from "../templateEngines";

export class ComponentRegistry {

    private templateEngine: HtmlTemplateEngine;
    private components: { [name: string]: IComponentDescriptor<any> | string } = {};

    constructor(templateEngine: HtmlTemplateEngine) {
        this.templateEngine = templateEngine;
    }

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
        let cd = this.components[name];
        let result: Rx.Observable<IComponentDescriptor<T>> = undefined;
        // if the component has been registered as resource, resolve it now and update registry
        if (cd != null) {
            if (isRxObservable(cd)) {
                result = cd;
            } else {
                if (typeof cd === "string") {
                    result = observableRequire<IComponentDescriptor<T>>(cd);
                } else {
                    result = Rx.Observable.of<IComponentDescriptor<T>>(cd);
                }
            }
        } else {
            result = Rx.Observable.of<IComponentDescriptor<T>>(undefined);
        }
        result = result.map(x => <IComponentDescriptor<T>> { template: this.compileTemplate(x.template), viewModel: x.viewModel });
        result.do(x => this.components[name] = x ); // cache descriptor

        return this.initialize<T>(result, params);
    }

    private initialize<T>(obs: Rx.Observable<IComponentDescriptor<T>>, params?: Object): Rx.Observable<IComponent<T>> {
        return obs.take(1).map<IComponent<T>>(descriptor => {
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
                if (tmp !== null) {
                    return nodeListToArray(tmp.childNodes);
                } else {
                    throw Error(`No template with id: "${template}" found`);
                }
            } else {
                return this.templateEngine.parse(template);
            }
        } else if (Array.isArray(template)) {
            return <Node[]> template;
        } else { throw Error("invalid template descriptor");
        }
    }

}
