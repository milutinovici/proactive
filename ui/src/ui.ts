import { fromEvent } from "rxjs";
import { ComponentRegistry } from "./componentRegistry";
import { DomManager } from "./domManager";
import { HtmlEngine } from "./templateEngines";
import { DirectiveRegistry } from "./directiveRegistry";
import { IScope, IConfiguration, IViewModel, IComponentDescriptor } from "./interfaces";
import { EventDirective } from "./directives/event";
import { IfDirective } from "./directives/if";
import { TextDirective } from "./directives/text";
import { AttrDirective, CssDirective, StyleDirective } from "./directives/oneWay";
import { ForDirective } from "./directives/for";
import { ValueDirective } from "./directives/value";
import { ComponentDirective } from "./directives/component";
import { KeyPressDirective } from "./directives/keypress";

export * from "./interfaces";
export { DirectiveHandler } from "./directives/directiveHandler";

export class ProactiveUI {
    public readonly directives: DirectiveRegistry;
    public readonly components: ComponentRegistry;
    public readonly domManager: DomManager;
    public readonly engine: HtmlEngine;

    constructor(config: IConfiguration = {}) {
        this.directives = new DirectiveRegistry();
        this.engine = new HtmlEngine(config.document || document);
        this.components = new ComponentRegistry(this.engine);

        this.domManager = new DomManager(this.directives);
        this.registerDirectives(this.domManager, this.engine, this.components);
    }

    /**
    * Renders supplied component, within the specified container
    * @param {IComponentDescriptor} component The component to be rendered
    * @param {Element} container The container of the component
    */
    public render(component: IComponentDescriptor, container: Element = document.body) {
        container.setAttribute(`${DirectiveRegistry.PREFIX}-component`, "'root-component'");
        this.components.register("root-component", component);
        this.domManager.applyDirectives({}, container);
        if (typeof window !== "undefined") {
            const sub = fromEvent<BeforeUnloadEvent>(window, "beforeunload").subscribe(() => {
                this.clean(container);
                sub.unsubscribe();
            });
        }
    }
    /**
    * Removes and cleans up any proactive related state from the specified node and its descendants.
    * @param {Node} node The node to be cleaned
    */
    public clean(node: Element) {
        this.domManager.cleanNode(node);
    }
    /**
    * Gets the scope of the supplied node. 
    * Scope contains viewmodel, and also new variables introduced in templates.
    * @param {Node} node The node
    */
    public getScope(node: Element): IScope | undefined {
        return this.domManager.getScope(node);
    }
    /**
    * Gets the viewmodel of the component which defined supplied node. 
    * @param {Node} node The node
    */
    public getViewmodel(node: Element): IViewModel | undefined {
        const scope = this.domManager.getScope(node);
        if (scope !== undefined) {
            return scope.$data;
        }
        return undefined;
    }

    private registerDirectives(domManager: DomManager, engine: HtmlEngine, registry: ComponentRegistry) {
        // out
        this.directives.register("text", new TextDirective());
        this.directives.register("attr", new AttrDirective());
        this.directives.register("css", new CssDirective());
        this.directives.register("style", new StyleDirective());
        // in
        this.directives.register("on", new EventDirective());
        this.directives.register("key", new KeyPressDirective());
        // two way
        this.directives.register("value", new ValueDirective());
        // structural
        this.directives.register("if", new IfDirective(domManager, engine));
        this.directives.register("for", new ForDirective(domManager, engine));
        this.directives.register("component", new ComponentDirective(domManager, engine, registry));
    }

}
