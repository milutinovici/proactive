// import it from "ava";
// import { HtmlEngine } from "../src/templateEngines";
// import { ComponentRegistry } from "../src/componentRegistry";
// import { DirectiveRegistry } from "../src/directiveRegistry";
// import { document, parse } from "./spec-utils";

// it("get directives from element with a single directive", t => {
//     const template = `<div x-text="'hello'"></div>`;
//     const el = <HTMLElement> parse(template)[0];
//     const registry = new DirectiveRegistry(new ComponentRegistry(new HtmlEngine(document)));
//     const { directives } = registry.createNodeState(el);
//     t.is(directives.length, 1, "element has 1 directive");
//     t.is(directives[0].handler.name, "text", "it is text directive");
//     t.is(directives[0].parameters.length, 0, "it has no parameters");
// });

// it("get directives from element with multiple directives", t => {
//     const template = `<div x-text="'hello'" x-attr:id="1"></div>`;
//     const el = <HTMLElement> parse(template)[0];
//     const registry = new DirectiveRegistry(new ComponentRegistry(new HtmlEngine(document)));
//     const { directives } = registry.createNodeState(el);
//     t.is(directives.length, 2, "element has 2 directives");
//     t.is(directives[0].parameters[0], "id", "attr has parameter id");
//     t.is(directives[1].parameters.length, 0, "text has no parameter");
// });
