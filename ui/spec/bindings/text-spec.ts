import * as it from "tape";
import * as px from "@proactive/extensions";
import { document, parse } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
const ui = new ProactiveUI({ document });

it("text: binding to a string constant", expect => {
    const template = `<span x-text="'foo'">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "foo");
    expect.end();
});

it("text: binding to a numeric constant", expect => {
    const template = `<span x-text="42">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "42");
    expect.end();
});

it("text: binding to a falsy numeric model value", expect => {
    const template = `<span x-text="$data">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = 0;

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "0");
    expect.end();
});

it("text: binding to a boolean constant", expect => {
    const template = `<span x-text="true">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, "true");
    expect.end();
});

it("text: binding to a non-observable model value", expect => {
    const template = `<span x-text="constantString">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = { constantString: "foo" };

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, model.constantString);
    expect.end();
});

it("text: binding to a observable model value", expect => {
    const template = `<span x-text="observableString">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];

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

// it("text: binding to a view computed observable", expect => {
//     const template = `<span x-text="'hello ' + observableString">invalid</span>`;
//     const el = <HTMLElement> parse(template)[0];

//     let model = { observableString: px.value("foo") };

//     expect.equal(el.textContent, "invalid");
//     expect.doesNotThrow(() => ui.applyBindings(model, el));
//     expect.equal(el.textContent, "hello " + model.observableString());
//     model.observableString("bar");
//     expect.equal(el.textContent, "hello " + model.observableString());
//     expect.end();
// });

it("text: handlebar binding works", expect => {
    const template = `<div>{{observableString}}</div>"`;
    const el = <HTMLElement> parse(template)[0];

    let model = { observableString: px.value("foo") };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.textContent, model.observableString());

    // should reflect value changes
    model.observableString("magic");
    expect.equal(el.textContent, model.observableString());

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    model.observableString("nope");
    expect.equal(el.textContent, "{{observableString}}");
    expect.end();
});
