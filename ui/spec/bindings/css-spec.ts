import * as it from "tape";
import { BehaviorSubject } from "rxjs";
import { document, parse, hasClass } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
const ui = new ProactiveUI({ document });

it("css: binding to a string constant", expect => {
    const template = `<div x-css:foo="true">empty</div>`;
    const el = <HTMLElement> parse(template)[0];

    const model = {};
    expect.false(hasClass(el, "foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));
    expect.end();
});

it("css: binding to a non-observable model value", expect => {
    const template = `<div x-css:foo="bool">empty</div>`;
    const el = <HTMLElement> parse(template)[0];

    const model = { bool: true };

    expect.false(hasClass(el, "foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));
    expect.end();
});

it("css: binding to a observable model value", expect => {
    const template = `<div x-css:foo="obs">empty</div>`;
    const el = <HTMLElement> parse(template)[0];

    const model = { obs: new BehaviorSubject(true) };

    expect.false(hasClass(el, "foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));

    // should reflect value changes
    model.obs.next(false);
    expect.false(hasClass(el, "foo"));

    // binding should stop updating after getting disposed
    ui.clean(el);
    model.obs.next(true);
    expect.false(hasClass(el, "foo"));
    expect.end();
});

it("css: binding multiple css classes to multiple observable model properties", expect => {
    const template = `<div x-css:foo="obs1" x-css:bar="obs2">empty</div>`;
    const el = <HTMLElement> parse(template)[0];

    let model = { obs1: new BehaviorSubject(true), obs2: new BehaviorSubject(false) };

    expect.false(hasClass(el, "foo"));
    expect.false(hasClass(el, "bar"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));
    expect.false(hasClass(el, "bar"));

    // should reflect value changes
    model.obs1.next(false);
    model.obs2.next(true);
    expect.false(hasClass(el, "foo"));
    expect.true(hasClass(el, "bar"));

    model.obs1.next(false);
    model.obs2.next(false);
    expect.false(hasClass(el, "foo"));
    expect.false(hasClass(el, "bar"));

    model.obs1.next(true);
    model.obs2.next(true);
    expect.true(hasClass(el, "foo"));
    expect.true(hasClass(el, "bar"));

    // binding should stop updating after getting disposed
    ui.clean(el);
    model.obs1.next(false);
    model.obs2.next(false);
    expect.true(hasClass(el, "foo"));
    expect.true(hasClass(el, "bar"));
    expect.end();
});
