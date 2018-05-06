import * as it from "tape";
import { document, parse } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
import { BehaviorSubject } from "rxjs";
const ui = new ProactiveUI({ document });

it("text: bind to a string constant", expect => {
    const template = `<span x-text="'foo'">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, "foo");
    expect.end();
});

it("text: bind to a numeric constant", expect => {
    const template = `<span x-text="42">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, "42");
    expect.end();
});

it("text: bind to a falsy numeric model value", expect => {
    const template = `<span x-text="zero">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = { zero: 0 };

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, "0");
    expect.end();
});

it("text: bind to a boolean constant", expect => {
    const template = `<span x-text="true">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, "true");
    expect.end();
});

it("text: bind to a non-observable model value", expect => {
    const template = `<span x-text="constantString">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = { constantString: "foo" };

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, model.constantString);
    expect.end();
});

it("text: bind to a observable model value", expect => {
    const template = `<span x-text="observableString">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];

    let model = { observableString: new BehaviorSubject("foo") };

    expect.equal(el.textContent, "invalid");
    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, model.observableString.getValue());

    model.observableString.next("magic");
    expect.equal(el.textContent, model.observableString.getValue(), "should reflect value changes");

    let oldValue = model.observableString.getValue();
    ui.clean(el);
    model.observableString.next("nope");
    expect.equal(el.textContent, oldValue, "should stop updating after getting disposed");
    expect.end();
});

// it("text: bind to a view computed observable", expect => {
//     const template = `<span x-text="'hello ' + observableString">invalid</span>`;
//     const el = <HTMLElement> parse(template)[0];

//     let model = { observableString: px.value("foo") };

//     expect.equal(el.textContent, "invalid");
//     expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
//     expect.equal(el.textContent, "hello " + model.observableString());
//     model.observableString("bar");
//     expect.equal(el.textContent, "hello " + model.observableString());
//     expect.end();
// });

it("text: handlebar directive works", expect => {
    const template = `<div>{{observableString}}</div>"`;
    const el = <HTMLElement> parse(template)[0];

    let model = { observableString: new BehaviorSubject("foo") };

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, model.observableString.getValue());

    model.observableString.next("magic");
    expect.equal(el.textContent, model.observableString.getValue(), "should reflect value changes");

    ui.clean(el);
    model.observableString.next("nope");
    expect.equal(el.textContent, "magic", "should stop updating after getting disposed");
    expect.end();
});

it("text: multiple handlebar directive work", expect => {
    const template = `<div>{{o1}} {{o2}}</div>"`;
    const el = <HTMLElement> parse(template)[0];

    let model = { o1: new BehaviorSubject("Hello"), o2: new BehaviorSubject("World") };

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(el.textContent, "Hello World");

    model.o1.next("Greetings");
    expect.equal(el.textContent, "Greetings World");

    model.o2.next("Universe");
    expect.equal(el.textContent, "Greetings Universe");
    expect.end();
});
