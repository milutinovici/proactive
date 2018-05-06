import { IDirectiveHandler, IDirective } from "./interfaces";
import { NodeState } from "./nodeState";
import { Directive } from "./directive";
import { isElement, tryParse } from "./utils";
import { ComponentRegistry } from "./componentRegistry";
import { exception } from "./exceptionHandlers";

export class DirectiveRegistry {
    public static readonly PREFIX = "x";
    public static readonly ATTR = ":";
    public static readonly ON = "@";
    private readonly handlers: Map<string, IDirectiveHandler>;
    private readonly components: ComponentRegistry;
    constructor(components: ComponentRegistry) {
        this.components = components;
        this.handlers = new Map<string, IDirectiveHandler>();
    }
    public register(handler: IDirectiveHandler) {
        if (!this.handlers.has(handler.name)) {
            this.handlers.set(handler.name, handler);
        } else {
            throw new Error(`directive handler with "${handler.name}" name is already registered`);
        }
    }

    public createNodeState(node: Node): NodeState | null {
        if (!isElement(node)) {
            return new NodeState([this.handleBarsToDirective(node)], {});
        }
        const tag = node["tagName"];
        const isCustomElement = this.components.registered(tag);
        if (!isCustomElement && !node.hasAttributes()) {
            return null;
        }
        const state = new NodeState([], {});
        if (isCustomElement) {
            // when a component is referenced as custom-element, apply a virtual 'component' directive
            state.directives.push(new Directive<string>(this.handlers.get("component") as IDirectiveHandler, `'${tag}'`, []));
            state.controlsDescendants += 1;
        }
        for (let i = 0; i < node.attributes.length; i++) {
            const directive = this.attributeToDirectiveOrProp(node.attributes[i]);
            if (!Array.isArray(directive)) {
                state.directives.push(directive);
                if (directive.handler.controlsDescendants) {
                    state.controlsDescendants += 1;
                }
            } else {
                state.constantProps[directive[0]] = directive[1];
            }
        }
        state.directives.sort((a: IDirective<any>, b: IDirective<any>) => b.handler.priority - a.handler.priority);
        return state;
    }

    private attributeToDirectiveOrProp(attribute: Attr): Directive<any> | [string, string|boolean|number] {
        const attrName = attribute.name;
        if (attrName[0] === DirectiveRegistry.PREFIX && attrName[1] === "-") {
            const array = attrName.slice(2).split(":");
            const name = array.shift() as string;
            const parameters = array[0] !== undefined ? array[0].split(".") : [];
            const handler = this.handlers.get(name);
            if (!handler) {
                exception.next(new Error(`directive handler "${name}" has not been registered.`));
                return [attrName, attribute.value];
            } else {
                return new Directive<any>(handler, attribute.value, parameters);
            }
        } else if (attrName[0] === DirectiveRegistry.ATTR) {
            const handler = this.handlers.get("attr") as IDirectiveHandler;
            return new Directive<any>(handler, attribute.value, [attrName.substring(1)]);
        } else if (attrName[0] === DirectiveRegistry.ON) {
            const handler = this.handlers.get("on") as IDirectiveHandler;
            return new Directive<any>(handler, attribute.value, [attrName.substring(1)]);
        } else {
            return [attrName, attribute.value === "" ? true : tryParse(attribute.value)];
        }
    }

    private handleBarsToDirective(node: Node): Directive<string> {
        const ms = new RegExp("{{([\\s\\S]*?)}}");
        const trimmed = (node.nodeValue as string).trim();
        const pieces = trimmed.split(ms);
        const values = pieces.filter((piece, i) => i % 2 === 1);
        const texts = pieces.filter((piece, i) => i % 2 === 0);
        return new Directive<string>(this.handlers.get("text") as IDirectiveHandler, values, texts);
    }
}
