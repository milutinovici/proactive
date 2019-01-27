import it from "ava";
import { BehaviorSubject } from "rxjs";
import { ProactiveUI } from "../../src/ui";
import { document, hasAttr, parse } from "../spec-utils";

const ui = new ProactiveUI({ document });

it("attr: bind to a string constant", async (t) => {
    const template = `<div x-attr:id="true">empty</div>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = {};
    t.false(hasAttr(el, "id"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasAttr(el, "id", "true"));

});

it("attr: bind to a non-observable model value", async (t) => {
    const template = `<div x-attr:id="str">empty</div>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = { str: "hello" };

    t.false(hasAttr(el, "id"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasAttr(el, "id", "hello"));

});

it("attr: you can use shorthand ':'", async (t) => {
    const template = `<div :id="'shorthand'">empty</div>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = {};
    t.false(hasAttr(el, "id"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasAttr(el, "id", "shorthand"));

});

it("attr: bind to a observable model value", async (t) => {
    const template = `<div :id="obs">empty</div>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = { obs: new BehaviorSubject("hello") };

    t.false(hasAttr(el, "id"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasAttr(el, "id", "hello"));

    // should reflect value changes
    model.obs.next("my");
    t.true(hasAttr(el, "id", "my"));

    // directive should stop updating after getting disposed
    ui.clean(el);
    model.obs.next("baby");
    t.true(hasAttr(el, "id", "my"));

});

it("attr: bind multiple attributes to multiple observables", async (t) => {
    const template = `<div :id="obs1" :name="obs2">empty</div>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = { obs1: new BehaviorSubject(1), obs2: new BehaviorSubject("hello") };

    t.false(hasAttr(el, "id"));
    t.false(hasAttr(el, "name"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasAttr(el, "id", "1"));
    t.true(hasAttr(el, "name", "hello"));

    // should reflect value changes
    model.obs1.next(2);
    model.obs2.next("my");
    t.true(hasAttr(el, "id", "2"));
    t.true(hasAttr(el, "name", "my"));

    // directive should stop updating after getting disposed
    ui.clean(el);
    model.obs1.next(3);
    model.obs2.next("baby");
    t.true(hasAttr(el, "id", "2"));
    t.true(hasAttr(el, "name", "my"));

});
