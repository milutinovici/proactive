import * as it from "tape";
import * as px from "@proactive/extensions";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";

const ui = new ProactiveUI({ document });

it("if: bind to a boolean constant (true) using static template", expect => {
    const template = `<div><span x-if="true">foo</span></div>`;
    const el = <HTMLElement> parse(template)[0];
    const span = el.firstElementChild as HTMLElement;

    expect.doesNotThrow(() => ui.render({}, el));
    expect.equal(span.parentElement, el, "span is div's child");
    expect.end();
});

it("if: bind to a boolean constant (false) using static template", expect => {
    const template = `<div><span x-if="false">foo</span></div>`;
    const el = <HTMLElement> parse(template)[0];
    const span = el.firstElementChild as HTMLElement;

    expect.doesNotThrow(() => ui.render({}, el));
    expect.equal(span.parentElement, null, "span isn't div's child");
    expect.end();
});

it("if: bind to a boolean observable value using static template", expect => {
    const template = `<div><span x-if="$data">foo</span></div>`;
    const el = <HTMLElement> parse(template)[0];

    const span = el.firstElementChild as HTMLElement;
    const prop = px.value(true);
    expect.doesNotThrow(() => ui.render(prop, el));

    expect.equal(span.parentElement, el);
    prop(false);
    expect.equal(span.parentElement, null);
    prop(true);
    ui.clean(el);
    prop(false);
    expect.equal(span.parentElement, el, "should stop updating after getting disposed");
    expect.end();
});

it("if: bind to a boolean observable value using dynamic template", expect => {
    const template = `<div><span x-if="$data" x-text="'foo'">bar</span></div>`;
    const el = <HTMLElement> parse(template)[0];

    let prop = px.value(true);
    expect.doesNotThrow(() => ui.render(prop, el));
    expect.equal(el.children[0].textContent, "foo");

    // try it again
    ui.clean(el);
    expect.doesNotThrow(() => ui.render(prop, el));
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
        show: px.value(true),
    };

    expect.doesNotThrow(() => ui.render(model, el));
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

    expect.doesNotThrow(() => ui.render({}, el));
    expect.equal(el.children[0].textContent, "foo");

    // try it again
    ui.clean(el);
    expect.equal(el.children[1].textContent, "foo");
    expect.end();
});

it("if: directive toggles other directives on an element", expect => {
    const template = `<div><div x-if="active" x-text="active"></div></div>`;
    const el = <HTMLElement> parse(template)[0];
    const active = px.value(false);
    const child = el.firstChild as Node;
    expect.doesNotThrow(() => ui.render({ active }, el));
    expect.equal(child.textContent, "");
    active(true);
    expect.equal(child.textContent, "true");

    expect.end();
});

it("if: cleans up after itself", expect => {
    const template = `<div><div x-if="active" x-text="active"></div></div>`;
    const el = <HTMLElement> parse(template)[0];
    const active = false;
    const child = el.firstChild as Node;
    expect.doesNotThrow(() => ui.render({ active }, el));
    expect.equal(el.children.length, 0);
    ui.clean(el);
    expect.equal(el.children[0], child);
    expect.end();
});