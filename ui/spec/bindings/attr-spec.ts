import * as it from "tape";
import { document, parse, hasAttr } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

const ui = new ProactiveUI({ document });

it("attr: binding to a string constant", expect => {
    const template = `<div x-attr:id="true">empty</div>`;
    const el = <HTMLInputElement> parse(template)[0];

    const model = {};
    expect.false(hasAttr(el, "id"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "id", "true"));
    expect.end();
});

it("attr: binding to a non-observable model value", expect => {
    const template = `<div x-attr:id="str">empty</div>`;
    const el = <HTMLInputElement> parse(template)[0];

    const model = { str: "hello" };

    expect.false(hasAttr(el, "id"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "id", "hello"));
    expect.end();
});

it("attr: you can use shorthand ':'", expect => {
    const template = `<div :id="'shorthand'">empty</div>`;
    const el = <HTMLInputElement> parse(template)[0];

    let model = {};
    expect.false(hasAttr(el, "id"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "id", "shorthand"));
    expect.end();
});

it("attr: binding to a observable model value", expect => {
    const template = `<div :id="obs">empty</div>`;
    const el = <HTMLInputElement> parse(template)[0];

    const model = { obs: new BehaviorSubject("hello") };

    expect.false(hasAttr(el, "id"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "id", "hello"));

    // should reflect value changes
    model.obs.next("my");
    expect.true(hasAttr(el, "id", "my"));

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    model.obs.next("baby");
    expect.true(hasAttr(el, "id", "my"));
    expect.end();
});

it("attr: binding multiple attributes to multiple observables", expect => {
    const template = `<div :id="obs1" :name="obs2">empty</div>`;
    const el = <HTMLInputElement> parse(template)[0];

    const model = { obs1: new BehaviorSubject(1), obs2: new BehaviorSubject("hello") };

    expect.false(hasAttr(el, "id"));
    expect.false(hasAttr(el, "name"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "id", "1"));
    expect.true(hasAttr(el, "name", "hello"));

    // should reflect value changes
    model.obs1.next(2);
    model.obs2.next("my");
    expect.true(hasAttr(el, "id", "2"));
    expect.true(hasAttr(el, "name", "my"));

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    model.obs1.next(3);
    model.obs2.next("baby");
    expect.true(hasAttr(el, "id", "2"));
    expect.true(hasAttr(el, "name", "my"));
    expect.end();
});
