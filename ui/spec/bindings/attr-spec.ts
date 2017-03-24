import * as it from "tape";
import * as px from "../../../core/src/proactive";
import * as ui from "../../src/proactiveUI";
import * as util from "../spec-utils";

it("attr: binding to a string constant", expect => {
    const template = `<div x-attr-data-foo="true">empty</div>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let model = {};
    expect.false(hasAttr(el, "data-foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "data-foo", "true"));
    expect.end();
});

it("attr: binding to a non-observable model value", expect => {
    const template = `<div x-attr-data-foo="constantString">empty</div>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let model = createCssModel();
    model.constantString = "data-foo";

    expect.false(hasAttr(el, "data-foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "data-foo"));
    expect.end();
});

it("attr: binding to a observable model value", expect => {
    const template = `<div x-attr-data-foo="observableString">empty</div>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let model = createCssModel();

    expect.false(hasAttr(el, "data-foo"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "data-foo"));

    // should reflect value changes
    model.observableString("");
    expect.true(hasAttr(el, "data-foo"));

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    model.observableString("voodoo");
    expect.true(hasAttr(el, "data-foo", ""));
    expect.end();
});

it("attr: binding multiple attr classes to multiple observable model properties", expect => {
    const template = `<div x-attr-data-foo="observableString" x-attr-data-bar="observableString2">empty</div>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let model = createCssModel();

    expect.false(hasAttr(el, "data-foo"));
    expect.false(hasAttr(el, "data-bar"));
    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(hasAttr(el, "data-foo", "voodoo"));
    expect.true(hasAttr(el, "data-foo", "magic"));

    // should reflect value changes
    model.observableString("");
    model.observableString2("doodle");
    expect.true(hasAttr(el, "data-foo", ""));
    expect.true(hasAttr(el, "data-bar", "doodle"));

    model.observableString("");
    model.observableString2("");
    expect.true(hasAttr(el, "data-foo", ""));
    expect.true(hasAttr(el, "data-bar", ""));

    model.observableString("voodoo");
    model.observableString2("magic");
    expect.true(hasAttr(el, "data-foo", "voodoo"));
    expect.true(hasAttr(el, "data-foo", "magic"));

    // binding should stop updating after getting disposed
    ui.cleanNode(el);
    model.observableString("");
    model.observableString2("");
    expect.true(hasAttr(el, "data-foo", "voodoo"));
    expect.true(hasAttr(el, "data-foo", "magic"));
    expect.end();
});

function hasAttr(element: HTMLElement, attr: string, val?: string) {
    return Array.prototype.some.call(element.attributes, (x: Attr) => x.name === attr);
}

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
