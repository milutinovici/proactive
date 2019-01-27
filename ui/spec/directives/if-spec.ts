import it from "ava";
import { BehaviorSubject } from "rxjs";
import { ProactiveUI } from "../../src/ui";
import { document, parse, triggerEvent } from "../spec-utils";

const ui = new ProactiveUI({ document });

it("if: bind to a boolean constant (true) using static template", async (t) => {
    const template = `<div><span x-if="true">foo</span></div>`;
    const el = parse(template)[0] as HTMLElement;
    const span = el.firstElementChild as HTMLElement;

    t.notThrows(() => ui.domManager.applyDirectives({}, el));
    t.is(span.parentElement, el, "span is div's child");

});

it("if: bind to a boolean constant (false) using static template", async (t) => {
    const template = `<div><span x-if="false">foo</span></div>`;
    const el = parse(template)[0] as HTMLElement;
    const span = el.firstElementChild as HTMLElement;

    t.notThrows(() => ui.domManager.applyDirectives({}, el));
    t.is(span.parentElement, null, "span isn't div's child");

});

it("if: bind to a boolean observable value using static template", async (t) => {
    const template = `<div><span x-if="obs">foo</span></div>`;
    const el = parse(template)[0] as HTMLElement;

    const span = el.firstElementChild as HTMLElement;
    const prop = new BehaviorSubject(true);
    t.notThrows(() => ui.domManager.applyDirectives({ obs: prop }, el));

    t.is(span.parentElement, el);
    prop.next(false);
    t.is(span.parentElement, null);
    prop.next(true);
    ui.clean(el);
    prop.next(false);
    t.is(span.parentElement, el, "should stop updating after getting disposed");

});

it("if: bind to a boolean observable value using dynamic template", async (t) => {
    const template = `<div><span x-if="obs" x-text="'foo'">bar</span></div>`;
    const el = parse(template)[0] as HTMLElement;

    const prop = new BehaviorSubject(true);
    t.notThrows(() => ui.domManager.applyDirectives({ obs: prop }, el));
    t.is(el.children[0].textContent, "foo");

    // try it again
    ui.clean(el);
    t.notThrows(() => ui.domManager.applyDirectives({ obs: prop }, el));
    t.is(el.children.length, 1);
    t.is(el.children[0].textContent, "foo");

});

it("if: bind to a boolean observable value using dynamic template with event", async (t) => {
    const template = `<div><button x-if="$data" x-on:click="cmd">Click me</button></div>`;
    const el = parse(template)[0] as HTMLElement;
    let count = 0;
    const model = {
        cmd: () => count++,
        show: new BehaviorSubject(true),
    };

    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(count, 0);
    triggerEvent(el.children[0] as HTMLElement, "click");
    t.is(count, 1);

    // try it again
    ui.clean(el);
    triggerEvent(el.children[0] as HTMLElement, "click");
    t.is(count, 1);

});

it("if: bind after removed element", async (t) => {
    const template = `<ul><li x-if="false"></li><li x-text="'foo'">bar</li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    t.notThrows(() => ui.domManager.applyDirectives({}, el));
    t.is(el.children[0].textContent, "foo");

    // try it again
    ui.clean(el);
    t.is(el.children[1].textContent, "foo");

});

it("if: directive toggles other directives on an element", async (t) => {
    const template = `<div><div x-if="active" x-text="active"></div></div>`;
    const el = parse(template)[0] as HTMLElement;
    const active = new BehaviorSubject(false);
    const child = el.firstChild as Node;
    t.notThrows(() => ui.domManager.applyDirectives({ active }, el));
    t.is(child.textContent, "");
    active.next(true);
    t.is(child.textContent, "true");

});

it("if: cleans up after itself", async (t) => {
    const template = `<div><div x-if="active" x-text="active"></div></div>`;
    const el = parse(template)[0] as HTMLElement;
    const active = false;
    const child = el.firstChild as Node;
    t.notThrows(() => ui.domManager.applyDirectives({ active }, el));
    t.is(el.children.length, 0);
    ui.clean(el);
    t.is(el.children[0], child);

});
