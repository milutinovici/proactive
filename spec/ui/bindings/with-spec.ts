import * as it from "tape";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/app";
import * as util from "../spec-utils";

it("with: bound to a non-observable value", expect => {
    const template = `<div x-with="childModel"><span x-text="foo">invalid</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let childModel = {
        foo: px.value("bar"),
    };

    let model = {
        childModel: childModel,
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));

    expect.equal(el.children[0].textContent, model.childModel.foo());
    model.childModel.foo("foo");
    expect.equal(el.children[0].textContent, model.childModel.foo());

    // try it again
    ui.cleanNode(el);
    model.childModel.foo("baz");
    expect.notEqual(el.children[0].textContent, model.childModel.foo());
    expect.end();
});

it("with: bound to an observable value", expect => {
    const template = `<div x-with="childModel"><span x-text="foo">invalid</span></div>`;
    const el = <HTMLElement> util.parse(template)[0];

    let childModel1 = {
        foo: px.value("bar"),
    };

    let childModel2 = {
        foo: px.value("magic"),
    };

    let model = {
        childModel: px.value<any>(childModel1),
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.equal(el.children[0].textContent, childModel1.foo());

    model.childModel().foo("foo");
    expect.equal(el.children[0].textContent, childModel1.foo());

    model.childModel(childModel2);
    expect.equal(el.children[0].textContent, childModel2.foo());

    // try it again
    ui.cleanNode(el);
    model.childModel().foo("baz");
    expect.notEqual(el.children[0].textContent, childModel2.foo());
    expect.end();
});
