import { Directive } from "./directive";
import { exception } from "./exceptionHandlers";
import { IDirective, IDirectiveHandler, IScope } from "./interfaces";
import { NodeState } from "./nodeState";
import { isElement, tryParse } from "./utils";

export class DirectiveRegistry {
    public static readonly PREFIX = "x";
    public static readonly ATTR = ":";
    public static readonly ON = "@";
    private readonly handlers: Map<string, IDirectiveHandler>;
    constructor() {
        this.handlers = new Map<string, IDirectiveHandler>();
    }
    public register(name: string, handler: IDirectiveHandler<any>) {
        if (!this.handlers.has(name)) {
            this.handlers.set(name, handler);
        } else {
            throw new Error(`directive handler with "${name}" name is already registered`);
        }
    }

    public createNodeState(node: Node, scope: IScope): NodeState | null {
        if (!isElement(node)) {
            return new NodeState([{ directive: this.handleBarsToDirective(node, scope) as IDirective, handler: this.handlers.get("text") as IDirectiveHandler }], {}, scope);
        }
        const tag = node.tagName;
        const isCustomElement = tag.indexOf("-") !== -1;
        if (!isCustomElement && !node.hasAttributes()) {
            return null;
        }
        const state = new NodeState([], {}, scope);
        if (isCustomElement) {
            // when a component is referenced as custom-element, apply a virtual 'component' directive
            state.directives.push({ directive: new Directive<string>(scope, "component", `'${tag}'`, []) as IDirective, handler: this.handlers.get("component") as IDirectiveHandler });
            state.controlsDescendants += 1;
        }
        for (let i = 0; i < node.attributes.length; i++) {
            const directive = this.attributeToDirectiveOrProp(node.attributes[i], scope);
            if (!Array.isArray(directive)) {
                const handler = this.handlers.get(directive.name) as IDirectiveHandler;
                state.directives.push({ directive, handler });
                if (handler.controlsDescendants) {
                    state.controlsDescendants += 1;
                }
            } else {
                state.constantProps[directive[0]] = directive[1];
            }
        }
        state.directives.sort((a, b) => b.handler.priority - a.handler.priority);
        return state;
    }

    private attributeToDirectiveOrProp(attribute: Attr, scope: IScope): Directive | [string, string|boolean|number] {
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
                return new Directive(scope, name, attribute.value, parameters);
            }
        } else if (attrName[0] === DirectiveRegistry.ATTR) {
            return new Directive(scope, "attr", attribute.value, [attrName.substring(1)]);
        } else if (attrName[0] === DirectiveRegistry.ON) {
            return new Directive(scope, "on", attribute.value, [attrName.substring(1)]);
        } else {
            return [attrName, attribute.value === "" ? true : tryParse(attribute.value)];
        }
    }

    private handleBarsToDirective(node: Node, scope: IScope): Directive<string> {
        const ms = new RegExp("{{([\\s\\S]*?)}}");
        const trimmed = (node.nodeValue as string).trim();
        const pieces = trimmed.split(ms);
        const values = pieces.filter((piece, i) => i % 2 === 1);
        const texts = pieces.filter((piece, i) => i % 2 === 0);
        return new Directive<string>(scope, "text", values, texts);
    }
}
