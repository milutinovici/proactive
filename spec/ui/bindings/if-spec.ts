import * as it from "tape";
import * as Rx from "rxjs";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/app";
import * as util from "../spec-utils";

it("if: binding to a boolean constant (true) using static template", expect => {
    const template = `<div x-if="true"><span>foo</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let backup = el.innerHTML;
    expect.doesNotThrow(() => ui.applyBindings({}, el));
    expect.equal(el.innerHTML, backup);
    expect.end();
});

it("if: binding to a boolean constant (false) using static template", expect => {
    const template = `<div x-if="false"><span>foo</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    expect.doesNotThrow(() => ui.applyBindings({}, el));
    expect.equal(el.innerHTML, "");
    expect.end();
});

it("if: binding to a boolean observable value using static template", expect => {
    const template = `<div x-if="$data"><span>foo</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let backup = el.innerHTML;
    let prop = px.value(true);
    expect.doesNotThrow(() => ui.applyBindings(prop, el));
    expect.equal(el.innerHTML, backup);
    prop(false);
    expect.equal(el.innerHTML, "");

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    prop(true);
    expect.equal(el.innerHTML, "");
    expect.end();
});

it("if: binding to a boolean observable using static template", expect => {
    const template = `<div x-if="$data"><span>foo</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let backup = el.innerHTML;
    let obs = new Rx.Subject<boolean>();
    expect.doesNotThrow(() => ui.applyBindings(obs, el));
    expect.equal(el.innerHTML, "");
    obs.next(true);
    expect.equal(el.innerHTML, backup);

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    obs.next(false);
    expect.equal(el.innerHTML, backup);
    expect.end();
});

it("if: binding to a boolean observable value using dynamic template", expect => {
    const template = `<div x-if="$data"><span x-text="'foo'">bar</span></div>`;
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
    const template = `<div x-if="$data"><button x-evt-click="cmd">Click me</button></div>`;
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
