import * as it from "tape";
import * as px from "../../../core/src/proactive";
import * as ui from "../../src/proactiveUI";
import * as util from "../spec-utils";

it("css: binding to a string constant", expect => {
    const template = `<div x-css-foo="true">empty</div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let model = {};
    expect.false(hasClass(el, "foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));
    expect.end();
});

it("css: binding to a non-observable model value", expect => {
    const template = `<div x-css-foo="constantBool">empty</div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let model = createCssModel();
    model.constantString = "foo";

    expect.false(hasClass(el, "foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));
    expect.end();
});

it("css: binding to a observable model value", expect => {
    const template = `<div x-css-foo="observableBool">empty</div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let model = createCssModel();

    expect.false(hasClass(el, "foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));

    // should reflect value changes
    model.observableBool(false);
    expect.false(hasClass(el, "foo"));

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    model.observableBool(true);
    expect.false(hasClass(el, "foo"));
    expect.end();
});

it("css: binding multiple css classes to multiple observable model properties", expect => {
    const template = `<div x-css-foo="observableBool" x-css-bar="observableBool2">empty</div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let model = createCssModel();

    expect.false(hasClass(el, "foo"));
    expect.false(hasClass(el, "bar"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasClass(el, "foo"));
    expect.false(hasClass(el, "bar"));

    // should reflect value changes
    model.observableBool(false);
    model.observableBool2(true);
    expect.false(hasClass(el, "foo"));
    expect.true(hasClass(el, "bar"));

    model.observableBool(false);
    model.observableBool2(false);
    expect.false(hasClass(el, "foo"));
    expect.false(hasClass(el, "bar"));

    model.observableBool(true);
    model.observableBool2(true);
    expect.true(hasClass(el, "foo"));
    expect.true(hasClass(el, "bar"));

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    model.observableBool(false);
    model.observableBool2(false);
    expect.true(hasClass(el, "foo"));
    expect.true(hasClass(el, "bar"));
    expect.end();
});

function createCssModel() {
    return {
        constantBool: true,
        constantNumeric: 42,
        constantString: "bar",
        observableBool: px.value(true),
        observableBool2: px.value(false),
        observableNumeric: px.value(96),
        observableString: px.value("voodoo"),
        observableString2: px.value("magic"),
    };
};

function hasClass(element: HTMLElement, css: string) {
    return element.className.indexOf(css) !== -1;
}
