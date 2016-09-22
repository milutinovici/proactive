import * as Rx from "rxjs";
import HtmlTemplateEngine from "./templateEngines";
import { BindingRegistry } from "./bindings/registry";
import { ComponentRegistry } from "./components/registry";
import { DomManager } from "./domManager";
import { IDataContext } from "./interfaces";

export class ProactiveUI {

    public components: ComponentRegistry;
    public bindings: BindingRegistry;
    public domManager: DomManager;
    public templateEngine: HtmlTemplateEngine;

    constructor(domManager: DomManager, templateEngine: HtmlTemplateEngine) {
        this.domManager = domManager;
        this.templateEngine = templateEngine;
        this.components = new ComponentRegistry(templateEngine);
        this.bindings = new BindingRegistry(domManager);

        Rx.Observable.fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
            this.domManager.cleanDescendants(document.documentElement);
        });
    }

    /**
    * Applies bindings to the specified node and all of its children using the specified data context.
    * @param {any} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    public applyBindings(model: any, node?: Node) {
        this.domManager.applyBindings(model, node || document.documentElement);
    }
    /**
    * Removes and cleans up any binding-related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    public cleanNode(node: HTMLElement) {
        this.domManager.cleanNode(node);
    }

    public contextFor(node: HTMLElement): IDataContext {
        return this.domManager.getDataContext(node);
    }

    public dataFor(node: HTMLElement): any {
        return this.domManager.nodeState.get(node).model;
    }

    public parseTemplate(template: string): Node[] {
        return this.templateEngine.parse(template);
    }
}

