import * as it from "tape";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/app";
import * as util from "../spec-utils";

it("component: Loads a component using simple string options", expect => {
    const str = `<div bind-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a component using its name as tag", expect => {
    const str = `<test-component></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<span bind-text="foo">invalid</span>`;
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings({ foo: "bar" }, el));
    expect.equal(el.textContent, "bar");
    expect.end();
});

it("component: Loads a component through an AMD module loader", expect => {
    const str = `<div bind-component="'test-component'" param-foo="42"></div>`;
    const el = <HTMLElement> util.parse(str)[0];
    ui.components.register("test-component", "templates/AMD/component1");

    window["vmHook"] = (params: any) => {
        expect.isNotEqual(params, undefined);
        expect.equal(params.foo, 42);

        // now install new hook for postBindingInit
        window["vmHook"] = () => {
            delete window["vmHook"];

            expect.equal((<HTMLElement> el.children[0]).childNodes[0].textContent, "bar");
            expect.end();
        };
    };

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    expect.end();
});

it("component: Loads a template from a string", expect => {
    const str = `<div bind-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a template from a node-array", expect => {
    const str = `<div bind-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", {
        template: util.parse(template),
    });

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a template from a selector", expect => {
    const template =  util.parse(`<span style="display:none;" id="template1">bar</span>`)[0];
    document.body.appendChild(template);
    const str = `<div bind-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    ui.components.register("test-component", { template: "#template1" });

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    expect.equal(el.innerHTML, "bar");
    expect.end();
});

it("component: Loads a template through an AMD module loader", expect => {
    const str = `<div bind-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    let vm = {
        init: function () {
            expect.equal(el.innerHTML, "<span>foo</span>");
            expect.end();
        },
    };

    ui.components.register("test-component", "text!templates/AMD/template1.html");

    expect.doesNotThrow(() => ui.applyBindings(vm, el));
    expect.end();
});

it("component: When the component isn't supplying a view-model, binding against parent-context works as expected", expect => {
    const str = `<div bind-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<span bind-text="foo">invalid</span>`;

    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings({ foo: "bar" }, el));
    expect.equal(el.children[0].textContent, "bar");
    expect.end();
});

it("component: Params get passed to view-model constructor", expect => {
    const str = `<div bind-component="'test-component'" param-foo="42"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<span bind-text="foo">invalid</span>`;

    // constructor 
    function constr(this: any, params: any) {
        this.foo = params.foo;
    }
    ui.components.register("test-component", { template: template, viewModel: constr });

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    expect.equal(el.childNodes[0].textContent, "42");
    expect.end();
});

it("component: Invokes preBindingInit", expect => {
    const str = `<test-component id="fixture5" params="foo: 42"></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    let invoked = false;
    let __this: any;
    let elementArg = false;
    let vm: any;

    vm = {
        preInit: function (this: any, element: HTMLElement) {  // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
            invoked = true;
            __this = this;
            elementArg = element instanceof HTMLElement;
        },
    };

    ui.components.register("test-component", {
        template: template,
        viewModel:  vm,
    });

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    expect.true(invoked);
    expect.equal(__this, vm);
    expect.true(elementArg);
    expect.end();
});

it("component: Invokes postBindingInit", expect => {
    const str = `<test-component id="fixture5" params="foo: 42"></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    let invoked = false;
    let __this: any;
    let elementArg = false;

    let vm: any;

    vm = {
        postInit: function(this: any, element: HTMLElement) {   // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
            invoked = true;
            __this = this;
            elementArg = element instanceof HTMLElement;
        },
    };

    ui.components.register("test-component", {
        template: template,
        viewModel: vm,
    });

    expect.doesNotThrow(() => ui.applyBindings(undefined, el));

    expect.true(invoked);
    expect.equal(__this, vm);
    expect.true(elementArg);
    expect.end();
});

it("component: Unsubscribes a component's viewmodel if has unsubscribe fn", expect => {
    const str = `<div bind-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    let unsubscribed = false;

    function vm(this: any) {
        this.unsubscribe = () => unsubscribed = true;
    }

    ui.components.register("test-component", {
        template: template,
        viewModel: vm,
    });

    expect.false(unsubscribed);
    expect.doesNotThrow(() => ui.applyBindings(undefined, el));
    ui.cleanNode(el);
    expect.true(unsubscribed);
    expect.end();
});

it("component: Components are properly isolated", expect => {
    const str = `<div bind-with="foo"><test-component></test-component></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<span bind-text="bar">invalid</span>`;
    let value = "baz";

    ui.components.register("test-component", {
        template: template,
        viewModel: { bar: value,
            preInit: (element: any, ctx: any) => {
                expect.equal(ctx.$root, ctx.$data);
                expect.true(ctx.$data.foo === undefined);
            },
        },
    });

    expect.doesNotThrow(() => ui.applyBindings({ foo: 42 }, el));
    expect.equal(el.childNodes[0].childNodes[0].textContent, value);
    expect.end();
});
