import * as it from "tape";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
import { BehaviorSubject } from "rxjs";

const ui = new ProactiveUI({ document });

it("if: bind to a boolean constant (true) using static template", expect => {
    const template = `<div><span x-if="true">foo</span></div>`;
    const el = <HTMLElement> parse(template)[0];
    const span = el.firstElementChild as HTMLElement;

    expect.doesNotThrow(() => ui.domManager.applyDirectives({}, el));
    expect.equal(span.parentElement, el, "span is div's child");
    expect.end();
});

it("if: bind to a boolean constant (false) using static template", expect => {
    const template = `<div><span x-if="false">foo</span></div>`;
    const el = <HTMLElement> parse(template)[0];
    const span = el.firstElementChild as HTMLElement;

    expect.doesNotThrow(() => ui.domManager.applyDirectives({}, el));
    expect.equal(span.parentElement, null, "span isn't div's child");
    expect.end();
});

it("if: bind to a boolean observable value using static template", expect => {
    const template = `<div><span x-if="obs">foo</span></div>`;
    const el = <HTMLElement> parse(template)[0];

    const span = el.firstElementChild as HTMLElement;
    const prop = new BehaviorSubject(true);
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ obs: prop }, el));

    expect.equal(span.parentElement, el);
    prop.next(false);
    expect.equal(span.parentElement, null);
    prop.next(true);
    ui.clean(el);
    prop.next(false);
    expect.equal(span.parentElement, el, "should stop updating after getting disposed");
    expect.end();
});

it("if: bind to a boolean observable value using dynamic template", expect => {
    const template = `<div><span x-if="obs" x-text="'foo'">bar</span></div>`;
    const el = <HTMLElement> parse(template)[0];

    let prop = new BehaviorSubject(true);
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ obs: prop }, el));
    expect.equal(el.children[0].textContent, "foo");

    // try it again
    ui.clean(el);
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ obs: prop }, el));
    expect.equal(el.children.length, 1);
    expect.equal(el.children[0].textContent, "foo");
    expect.end();
});

it("if: bind to a boolean observable value using dynamic template with event", expect => {
    const template = `<div><button x-if="$data" x-on:click="cmd">Click me</button></div>`;
    const el = <HTMLElement> parse(template)[0];
    let count = 0;
    let model = {
        cmd: () => count++,
        show: new BehaviorSubject(true),
    };

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(count, 0);
    triggerEvent(<HTMLElement> el.children[0], "click");
    expect.equal(count, 1);

    // try it again
    ui.clean(el);
    triggerEvent(<HTMLElement> el.children[0], "click");
    expect.equal(count, 1);
    expect.end();
});

it("if: bind after removed element", expect => {
    const template = `<ul><li x-if="false"></li><li x-text="'foo'">bar</li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    expect.doesNotThrow(() => ui.domManager.applyDirectives({}, el));
    expect.equal(el.children[0].textContent, "foo");

    // try it again
    ui.clean(el);
    expect.equal(el.children[1].textContent, "foo");
    expect.end();
});

it("if: directive toggles other directives on an element", expect => {
    const template = `<div><div x-if="active" x-text="active"></div></div>`;
    const el = <HTMLElement> parse(template)[0];
    const active = new BehaviorSubject(false);
    const child = el.firstChild as Node;
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ active }, el));
    expect.equal(child.textContent, "");
    active.next(true);
    expect.equal(child.textContent, "true");

    expect.end();
});

it("if: cleans up after itself", expect => {
    const template = `<div><div x-if="active" x-text="active"></div></div>`;
    const el = <HTMLElement> parse(template)[0];
    const active = false;
    const child = el.firstChild as Node;
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ active }, el));
    expect.equal(el.children.length, 0);
    ui.clean(el);
    expect.equal(el.children[0], child);
    expect.end();
});
