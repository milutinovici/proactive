import { Observable, Observer, Subscription, from, of, EMPTY } from "rxjs";
import { map, tap } from "rxjs/operators";
import { IComponentDescriptor, IViewModel } from "./interfaces";
import { isFunction, isTemplate } from "./utils";
import { HtmlEngine } from "./templateEngines";
import { exception } from "./exceptionHandlers";
export class ComponentRegistry {

    private readonly components = new Map<string, IComponentDescriptor | string>();
    private readonly engine: HtmlEngine;
    constructor(engine: HtmlEngine) {
        this.engine = engine;
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

    public registered(name: string): boolean {
        return this.components.has(name);
    }

    public load(name: string): Observable<IComponentDescriptor> {
        name = name.toUpperCase();
        let result = this.getDescriptor(name);
        return result.pipe(
            map(desc => Object.assign({}, desc, { template: this.compileTemplate(desc.template) }) as IComponentDescriptor),
            tap(x => this.components.set(name, x)) // cache descriptor
        );
    }

    private getDescriptor(name: string): Observable<IComponentDescriptor> {
        const descriptor = this.components.get(name);
        if (descriptor != null) {
            if (typeof descriptor === "string") {
                return this.import<IComponentDescriptor>(descriptor);
            } else {
                return of<IComponentDescriptor>(descriptor);
            }
        } else {
            exception.next(new Error(`No component with name '${name}' is registered`));
            return EMPTY;
        }
    }

    public initialize<T extends Object>(name: string, descriptor: IComponentDescriptor, props: T, viewmodel?: T): IViewModel | undefined {
        let vm = viewmodel || descriptor.viewmodel || props; // if no vm defined, props are vm, aka stateless
        if (isFunction(vm)) {
            let model: IViewModel | undefined;
            try {
                model = new vm(props);
            } catch (e) {
                exception.next(new Error(`Failed in constructor of component "${name}". ${e.message}`));
            }
            return model;
        }
        return vm;
    }

    private compileTemplate(template: HTMLTemplateElement | DocumentFragment | string): HTMLTemplateElement {
        if (typeof template === "string") {
            if (template[0] === "#") {
                const tmp = this.engine.getElementById(template.slice(1, template.length));
                if (tmp !== null && isTemplate(tmp)) {
                    return tmp;
                } else if (tmp !== null) {
                    const t = this.engine.createTemplate();
                    t.content.appendChild(tmp);
                    return t;
                } else {
                    throw Error(`No template with id: "${template}" found`);
                }
            } else {
                const t = this.engine.createTemplate();
                t.content.appendChild(this.engine.parse(template));
                return t;
            }
        } else if (isTemplate(template)) {
            return template;
        } else if (Array.isArray(template)) {
            const t = this.engine.createTemplate();
            t.content.appendChild(this.engine.nodeListToFragment(template as any));
            return t;
        } else if (this.engine.isFragment(template)) {
            const t = this.engine.createTemplate();
            t.content.appendChild(template);
            return t;
        } else {
            throw Error("invalid template descriptor");
        }
    }

    /**
    * Import a component dynamically
    * @param {string} module component to load
    * @return {Observable<any>} An observable that yields a value and completes as soon as the module has been loaded
    */
    private import<T>(module: string): Observable<T> {
        const requireFunc = require || (window != null ? window["require"] : null);
        if (!isFunction(requireFunc)) {
            try {
                return from(import(`./${module}`));
            } catch {
                throw new Error("there's no AMD-module loader available (Hint: did you forget to include RequireJS in your project?)");
            }
        }
        return Observable.create((observer: Observer<T>) => {
            try {
                requireFunc([module], (m: T) => {
                    observer.next(m);
                    observer.complete();
                }, (err: Error) => {
                        observer.error(err);
                    });
            } catch (e) {
                observer.error(e);
            }

            return Subscription.EMPTY;
        });
    }
}

declare function require(modules: string[], successCB: (s: any) => any, errCB: (err: Error) => any): void;