import it from "ava";
import { document, parse } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
import { BehaviorSubject } from "rxjs";
const ui = new ProactiveUI({ document });

it("text: bind to a string constant", async t => {
    const template = `<span x-text="'foo'">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    t.is(el.textContent, "invalid");
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, "foo");
    
});

it("text: bind to a numeric constant", async t => {
    const template = `<span x-text="42">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    t.is(el.textContent, "invalid");
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, "42");
    
});

it("text: bind to a falsy numeric model value", async t => {
    const template = `<span x-text="zero">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = { zero: 0 };

    t.is(el.textContent, "invalid");
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, "0");
    
});

it("text: bind to a boolean constant", async t => {
    const template = `<span x-text="true">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = {};

    t.is(el.textContent, "invalid");
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, "true");
    
});

it("text: bind to a non-observable model value", async t => {
    const template = `<span x-text="constantString">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];
    let model = { constantString: "foo" };

    t.is(el.textContent, "invalid");
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, model.constantString);
    
});

it("text: bind to a observable model value", async t => {
    const template = `<span x-text="observableString">invalid</span>`;
    const el = <HTMLElement> parse(template)[0];

    let model = { observableString: new BehaviorSubject("foo") };

    t.is(el.textContent, "invalid");
    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, model.observableString.getValue());

    model.observableString.next("magic");
    t.is(el.textContent, model.observableString.getValue(), "should reflect value changes");

    let oldValue = model.observableString.getValue();
    ui.clean(el);
    model.observableString.next("nope");
    t.is(el.textContent, oldValue, "should stop updating after getting disposed");
    
});

// it("text: bind to a view computed observable", async t => {
//     const template = `<span x-text="'hello ' + observableString">invalid</span>`;
//     const el = <HTMLElement> parse(template)[0];

//     let model = { observableString: px.value("foo") };

//     t.is(el.textContent, "invalid");
//     t.notThrows(() => ui.domManager.applyDirectives(model, el));
//     t.is(el.textContent, "hello " + model.observableString());
//     model.observableString("bar");
//     t.is(el.textContent, "hello " + model.observableString());
//     
// });

it("text: handlebar directive works", async t => {
    const template = `<div>{{observableString}}</div>"`;
    const el = <HTMLElement> parse(template)[0];

    let model = { observableString: new BehaviorSubject("foo") };

    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, model.observableString.getValue());

    model.observableString.next("magic");
    t.is(el.textContent, model.observableString.getValue(), "should reflect value changes");

    ui.clean(el);
    model.observableString.next("nope");
    t.is(el.textContent, "magic", "should stop updating after getting disposed");
    
});

it("text: multiple handlebar directive work", async t => {
    const template = `<div>{{o1}} {{o2}}</div>"`;
    const el = <HTMLElement> parse(template)[0];

    let model = { o1: new BehaviorSubject("Hello"), o2: new BehaviorSubject("World") };

    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(el.textContent, "Hello World");

    model.o1.next("Greetings");
    t.is(el.textContent, "Greetings World");

    model.o2.next("Universe");
    t.is(el.textContent, "Greetings Universe");
    
});
