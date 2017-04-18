import * as it from "tape";

import { BindingProvider } from "../src/bindingProvider";
import * as util from "./spec-utils";

it("get bindings from element with a single binding", expect => {
    const template = `<div x-text="'hello'"></div>`;
    const el = <HTMLElement> util.parse(template)[0];
    const bindings = BindingProvider.getBindings(el);
    expect.equal(bindings.length, 1, "element has 1 binding");
    expect.equal(bindings[0].handler.name, "text", "it is text binding");
    expect.equal(bindings[0].parameter, undefined, "it has no parmeters");
    expect.end();
});

it("get bindings from element with multiple bindings", expect => {
    const template = `<div x-text="'hello'" x-attr-id="1"></div>`;
    const el = <HTMLElement> util.parse(template)[0];
    const bindings = BindingProvider.getBindings(el);
    expect.equal(bindings.length, 2, "element has 2 bindings");
    expect.equal(bindings[0].parameter, "id", "attr has parameter id");
    expect.equal(bindings[1].parameter, undefined, "text has no parameter");

    expect.end();
});

// it("get binding handlers from element with a non registered binding handler", expect => {
//     const template = `<div x-texxt="'hello'"></div>`;
//     const el = <HTMLElement> util.parse(template)[0];
//     const provider = new BindingProvider();
//     const bindings = provider.getBindings(el);
//     expect.throws(() => provider.getBindingHandlers(bindings));
//     expect.end();
// });
