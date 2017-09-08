import * as Rx from "rxjs";
import { IComponentDescriptor, IViewModel } from "../interfaces";
import { observableRequire, isFunction, isElement } from "../utils";
import { HtmlEngine } from "../templateEngines";
import { exception } from "../exceptionHandlers";
export class ComponentRegistry {

    private readonly components = new Map<string, IComponentDescriptor | string>();
    private readonly engine: HtmlEngine;
    private readonly router?: object;
    constructor(engine: HtmlEngine, router?: object) {
        this.engine = engine;
        this.router = router;
    }

    // component is either a descriptor or a require string
    public register(name: string, component: IComponentDescriptor | string) {
        if (name.indexOf("-") === -1) {
            throw new Error(`Component name "${name}" must contain a dash (-)` );
        }
        this.components.set(name.toUpperCase(), component);
    }

    public isRegistered(name: string): boolean {
        return this.components.has(name.toUpperCase());
    }

    public registered(name: string) {
        return this.components.has(name);
    }

    public load(name: string): Rx.Observable<IComponentDescriptor> {
        name = name.toUpperCase();
        let result = this.getDescriptor(name);
        result = result.map(x => <IComponentDescriptor> { name: name, template: this.compileTemplate(x.template), viewModel: x.viewModel });
        result.do(x => this.components.set(name, x)); // cache descriptor
        return result;
    }

    private getDescriptor(name: string): Rx.Observable<IComponentDescriptor> {
        const descriptor = this.components.get(name);
        if (descriptor != null) {
            if (typeof descriptor === "string") {
                return observableRequire<IComponentDescriptor>(descriptor);
            } else {
                return Rx.Observable.of<IComponentDescriptor>(descriptor);
            }
        } else {
            exception.next(new Error(`No component with name '${name}' is registered`));
            return Rx.Observable.empty<IComponentDescriptor>();
        }
    }

    public initialize<T extends Object>(descriptor: IComponentDescriptor, params: T, viewModel?: T): IViewModel | undefined {
        let vm = viewModel || descriptor.viewModel;
        if (isFunction(vm)) {
            let model: IViewModel | undefined;
            try {
                params["$router"] = this.router;
                model = new vm(params);
            } catch (e) {
                exception.next(new Error(`Failed in constructor of component "${descriptor.name}". ${e.message}`));
            }
            return model;
        }
        return vm;
    }

    private compileTemplate(template: DocumentFragment | string): DocumentFragment {
        if (typeof template === "string") {
            if (template[0] === "#") {
                const tmp = this.engine.getElementById(template.slice(1, template.length));
                if (tmp !== null && isElement(tmp) && tmp["content"] !== undefined) { // template
                    return tmp["content"];
                } else if (tmp !== null) {
                    return this.engine.nodeListToFragment(tmp.childNodes);
                } else {
                    throw Error(`No template with id: "${template}" found`);
                }
            } else {
                return this.engine.parse(template);
            }
        } else if (Array.isArray(template)) {
            return this.engine.nodeListToFragment(template as any);
        } else if (this.engine.isFragment(template)) {
            return template;
        } else {
            throw Error("invalid template descriptor");
        }
    }

}
