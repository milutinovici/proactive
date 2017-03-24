import * as it from "tape";
import * as px from "../../../core/src/proactive";
import * as ui from "../../src/proactiveUI";
import * as util from "../spec-utils";

it("if: binding to a boolean constant (true) using static template", expect => {
    const template = `<div><span x-if="true">foo</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];
    const span = el.firstElementChild as HTMLElement;

    expect.doesNotThrow(() => ui.applyBindings({}, el));
    expect.equal(span.parentElement, el, "span is div's child");
    expect.end();
});

it("if: binding to a boolean constant (false) using static template", expect => {
    const template = `<div><span x-if="false">foo</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];
    const span = el.firstElementChild as HTMLElement;

    expect.doesNotThrow(() => ui.applyBindings({}, el));
    expect.equal(span.parentElement, null, "span isn't div's child");
    expect.end();
});

it("if: binding to a boolean observable value using static template", expect => {
    const template = `<div><span x-if="$data">foo</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    const span = el.firstElementChild as HTMLElement;
    const prop = px.value(true);
    expect.doesNotThrow(() => ui.applyBindings(prop, el));

    expect.equal(span.parentElement, el);
    prop(false);
    expect.equal(span.parentElement, null);

    ui.cleanNode(el);
    prop(true);
    expect.equal(span.parentElement, null, "binding should stop updating after getting disposed");
    expect.end();
});

it("if: binding to a boolean observable value using dynamic template", expect => {
    const template = `<div><span x-if="$data" x-text="'foo'">bar</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let prop = px.value(true);
    expect.doesNotThrow(() => ui.applyBindings(prop, el));
    expect.equal(el.children[0].textContent, "foo");

    // try it again
    ui.cleanNode(el);
    expect.doesNotThrow(() => ui.applyBindings(prop, el));
    expect.equal(el.children.length, 1);
    expect.equal(el.children[0].textContent, "foo");
    expect.end();
});

it("if: binding to a boolean observable value using dynamic template with event", expect => {
    const template = `<div><button x-if="$data" x-on-click="cmd">Click me</button></div>`;
    const el = <HTMLElement> util.parse(template)[0];
    let count = 0;
    let model = {
        cmd: () => count++,
        show: px.value(true),
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(count, 0);
    util.triggerEvent(<HTMLElement> el.children[0], "click");
    expect.equal(count, 1);

    // try it again
    ui.cleanNode(el);
    util.triggerEvent(<HTMLElement> el.children[0], "click");
    expect.equal(count, 1);
    expect.end();
});

it("if: binding after removed element", expect => {
    const template = `<ul><li x-if="false"></li><li x-text="'foo'">bar</li></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    expect.doesNotThrow(() => ui.applyBindings({}, el));
    expect.equal(el.children[0].textContent, "foo");

    // try it again
    ui.cleanNode(el);
    expect.equal(el.children.length, 1);
    expect.equal(el.children[1].textContent, "foo");
    expect.end();
});