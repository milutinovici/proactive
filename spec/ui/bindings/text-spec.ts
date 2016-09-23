import * as it from "tape";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/app";
import * as util from "../spec-utils";

it("binding to a string constant", expect => {
    const template = `<span bind-text="'foo'">invalid</span>`;
    const el = <HTMLElement> util.parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "foo");
    expect.end();
});

it("binding to a numeric constant", expect => {
    const template = `<span bind-text="42">invalid</span>`;
    const el = <HTMLElement> util.parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "42");
    expect.end();
});

it("binding to a falsy numeric model value", expect => {
    const template = `<span bind-text="$data">invalid</span>`;
    const el = <HTMLElement> util.parse(template)[0];
    let model = 0;

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "0");
    expect.end();
});

it("binding to a boolean constant", expect => {
    const template = `<span bind-text="true">invalid</span>`;
    const el = <HTMLElement> util.parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "true");
    expect.end();
});

it("binding to a non-observable model value", expect => {
    const template = `<span bind-text="constantString">invalid</span>`;
    const el = <HTMLElement> util.parse(template)[0];
    let model = { constantString: "foo" };

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, model.constantString);
    expect.end();
});

it("binding to a observable model value", expect => {
    const template = `<span bind-text="observableString">invalid</span>`;
    const el = <HTMLElement> util.parse(template)[0];

    let model = { observableString: px.value("foo") };

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, model.observableString());

    // should reflect value changes
    model.observableString("magic");
    expect.equal(el.textContent, model.observableString());

    // binding should stop updating after getting disposed
    let oldValue = model.observableString();
    ui.cleanNode(el);
    model.observableString("nope");
    expect.equal(el.textContent, oldValue);
    expect.end();
});

it("binding to a view computed observable", expect => {
    const template = `<span bind-text="'hello ' + observableString">invalid</span>`;
    const el = <HTMLElement> util.parse(template)[0];

    let model = { observableString: px.value("foo") };

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "hello " + model.observableString());
    model.observableString("bar");
    expect.equal(el.textContent, "hello " + model.observableString());
    expect.end();
});
