// import * as it from "tape";
// import { HtmlEngine } from "../src/templateEngines";
// import { ComponentRegistry } from "../src/componentRegistry";
// import { DirectiveRegistry } from "../src/directiveRegistry";
// import { document, parse } from "./spec-utils";

// it("get directives from element with a single directive", expect => {
//     const template = `<div x-text="'hello'"></div>`;
//     const el = <HTMLElement> parse(template)[0];
//     const registry = new DirectiveRegistry(new ComponentRegistry(new HtmlEngine(document)));
//     const { directives } = registry.createNodeState(el);
//     expect.equal(directives.length, 1, "element has 1 directive");
//     expect.equal(directives[0].handler.name, "text", "it is text directive");
//     expect.equal(directives[0].parameters.length, 0, "it has no parameters");
//     expect.end();
// });

// it("get directives from element with multiple directives", expect => {
//     const template = `<div x-text="'hello'" x-attr:id="1"></div>`;
//     const el = <HTMLElement> parse(template)[0];
//     const registry = new DirectiveRegistry(new ComponentRegistry(new HtmlEngine(document)));
//     const { directives } = registry.createNodeState(el);
//     expect.equal(directives.length, 2, "element has 2 directives");
//     expect.equal(directives[0].parameters[0], "id", "attr has parameter id");
//     expect.equal(directives[1].parameters.length, 0, "text has no parameter");

//     expect.end();
// });
