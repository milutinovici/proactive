import it from "ava";
import { BehaviorSubject } from "rxjs";
import { ProactiveUI } from "../../src/ui";
import { document, hasClass, parse } from "../spec-utils";

const ui = new ProactiveUI({ document });

it("css: bind to a string constant", async (t) => {
    const template = `<div x-css:foo="true">empty</div>`;
    const el = parse(template)[0] as HTMLElement;

    const model = {};
    t.false(hasClass(el, "foo"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasClass(el, "foo"));

});

it("css: bind to a non-observable model value", async (t) => {
    const template = `<div x-css:foo="bool">empty</div>`;
    const el = parse(template)[0] as HTMLElement;

    const model = { bool: true };

    t.false(hasClass(el, "foo"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasClass(el, "foo"));

});

it("css: bind to a observable model value", async (t) => {
    const template = `<div x-css:foo="obs">empty</div>`;
    const el = parse(template)[0] as HTMLElement;

    const model = { obs: new BehaviorSubject(true) };

    t.false(hasClass(el, "foo"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasClass(el, "foo"));

    model.obs.next(false);
    t.false(hasClass(el, "foo"), "should reflect value changes");

    ui.clean(el);
    model.obs.next(true);
    t.false(hasClass(el, "foo"), "should stop updating after getting disposed");

});

it("css: bind multiple css classes to multiple observable model properties", async (t) => {
    const template = `<div x-css:foo="obs1" x-css:bar="obs2">empty</div>`;
    const el = parse(template)[0] as HTMLElement;

    const model = { obs1: new BehaviorSubject(true), obs2: new BehaviorSubject(false) };

    t.false(hasClass(el, "foo"));
    t.false(hasClass(el, "bar"));
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.true(hasClass(el, "foo"));
    t.false(hasClass(el, "bar"));

    model.obs1.next(false);
    model.obs2.next(true);
    t.false(hasClass(el, "foo"), "should reflect value changes");
    t.true(hasClass(el, "bar"), "should reflect value changes");

    model.obs1.next(false);
    model.obs2.next(false);
    t.false(hasClass(el, "foo"));
    t.false(hasClass(el, "bar"));

    model.obs1.next(true);
    model.obs2.next(true);
    t.true(hasClass(el, "foo"));
    t.true(hasClass(el, "bar"));

    ui.clean(el);
    model.obs1.next(false);
    model.obs2.next(false);
    t.true(hasClass(el, "foo"), "should stop updating after getting disposed");
    t.true(hasClass(el, "bar"), "should stop updating after getting disposed");

});
