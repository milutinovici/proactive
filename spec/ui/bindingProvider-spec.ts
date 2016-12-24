import * as it from "tape";

import { BindingProvider } from "../../src/ui/bindingProvider";
import * as util from "./spec-utils";

it("get bindings from element with a single binding", expect => {
    const template = `<div x-text="'hello'"></div>`;
    const el = <HTMLElement> util.parse(template)[0];
    const provider = new BindingProvider();
    const bindings = provider.getBindings(el);
    expect.equal(bindings.length, 1, "element has 1 binding");
    expect.equal(bindings[0].name, "text", "it is text binding");
    expect.equal(bindings[0].parameter, undefined, "it has no parmeters");
    expect.end();
});

it("get bindings from element with multiple bindings", expect => {
    const template = `<div x-text="'hello'" x-attr-id="1"></div>`;
    const el = <HTMLElement> util.parse(template)[0];
    const provider = new BindingProvider();
    const bindings = provider.getBindings(el);
    expect.equal(bindings.length, 2, "element has 2 bindings");
    expect.equal(bindings[0].name, "text", "1st is text binding");
    expect.equal(bindings[0].parameter, undefined, "1st has no parameter");
    expect.equal(bindings[1].name, "attr", "2nd is attr");
    expect.equal(bindings[1].parameter, "id", "2nd has parameter id");
    expect.end();
});

// it("get binding handlers from element with a single binding", expect => {
//     const template = `<div x-text="'hello'"></div>`;
//     const el = <HTMLElement> util.parse(template)[0];
//     const provider = new BindingProvider();
//     const bindings = provider.getBindings(el);
//     const handlers = provider.getBindingHandlers(bindings);
//     expect.equal(handlers.length, 1, "1 handler");
//     expect.assert(handlers[0].handler);
//     expect.end();
// });

// it("get binding handlers from element with multiple bindings", expect => {
//     const template = `<div x-text="'hello'" x-attr-id="1"></div>`;
//     const el = <HTMLElement> util.parse(template)[0];
//     const provider = new BindingProvider();
//     const bindings = provider.getBindings(el);
//     const handlers = provider.getBindingHandlers(bindings);
//     expect.equal(handlers.length, 2, "2 handlers");
//     expect.assert(handlers[0].handler, "1st handler");
//     expect.assert(handlers[1].handler, "2nd handler");
//     expect.end();
// });

// it("get binding handlers from element with a non registered binding handler", expect => {
//     const template = `<div x-texxt="'hello'"></div>`;
//     const el = <HTMLElement> util.parse(template)[0];
//     const provider = new BindingProvider();
//     const bindings = provider.getBindings(el);
//     expect.throws(() => provider.getBindingHandlers(bindings));
//     expect.end();
// });
