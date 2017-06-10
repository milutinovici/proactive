import * as it from "tape";
import * as Rx from "rxjs";
import * as ui from "../../src/ui";
import { IDataContext } from "../../src/interfaces";
import * as util from "../spec-utils";

it("component: Loads a component using simple string options", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a component using its name as tag", expect => {
    const str = `<test-component></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<span x-text="foo">invalid</span>`;
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings({ foo: "bar" }, el));
    expect.equal(el.textContent, "bar");
    expect.end();
});

it("component: Loads a component through an AMD module loader", expect => {
    const str = `<div x-component="'test-component'" x-attr-foo="42"></div>`;
    const el = <HTMLElement> util.parse(str)[0];
    ui.components.register("test-component", "src/ui/components/my-select");

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

    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    expect.end();
});

it("component: Loads a template through an AMD module loader", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    let vm = {
        init: function () {
            expect.equal(el.innerHTML, "<span>foo</span>");
            expect.end();
        },
    };

    ui.components.register("test-component", "text!src/ui/components/my-select.html");

    expect.doesNotThrow(() => ui.applyBindings(vm, el));
    expect.end();
});

it("component: Loads a template from a string", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a template from a node-array", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", {
        template: util.parseFrag(template),
    });

    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a template from a selector", expect => {
    const template =  util.parse(`<span style="display:none;" id="template1">bar</span>`)[0];
    document.body.appendChild(template);
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    ui.components.register("test-component", { template: "#template1" });

    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    expect.equal(el.innerHTML, "bar");
    expect.end();
});

it("component: When the component isn't supplying a view-model, binding against parent-context works as expected", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<span x-text="foo">invalid</span>`;

    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.applyBindings({ foo: "bar" }, el));
    expect.equal(el.children[0].textContent, "bar");
    expect.end();
});

it("component: Params get passed to view-model constructor", expect => {
    const str = `<div x-component="'test-component'" x-attr-foo="42"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<span x-text="foo">invalid</span>`;

    // constructor 
    function constr(this: any, params: any) {
        this.foo = params.foo;
    }
    ui.components.register("test-component", { template: template, viewModel: constr });

    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    expect.equal(el.childNodes[0].textContent, "42");
    expect.end();
});

it("component: Invokes preBindingInit", expect => {
    const str = `<test-component id="fixture5" x-attr-foo="42"></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    let invoked = false;
    let self: any;
    let elementArg = false;
    let vm: any;

    vm = {
        preInit: function (this: any, element: HTMLElement) {  // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
            invoked = true;
            self = this;
            elementArg = element instanceof HTMLElement;
        },
    };

    ui.components.register("test-component", {
        template: template,
        viewModel:  vm,
    });

    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    expect.true(invoked);
    expect.equal(self, vm);
    expect.true(elementArg);
    expect.end();
});

it("component: Invokes postBindingInit", expect => {
    const str = `<test-component id="fixture5" x-attr-foo="42"></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = "<span>foo</span>";
    let invoked = false;
    let self: any;
    let elementArg = false;

    let vm: any;

    vm = {
        postInit: function(this: any, element: HTMLElement) {   // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
            invoked = true;
            self = this;
            elementArg = element instanceof HTMLElement;
        },
    };

    ui.components.register("test-component", {
        template: template,
        viewModel: vm,
    });

    expect.doesNotThrow(() => ui.applyBindings({ }, el));

    expect.true(invoked);
    expect.equal(self, vm);
    expect.true(elementArg);
    expect.end();
});

it("component: Unsubscribes a component's viewmodel if has cleanup subscription", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> util.parse(str)[0];
    const template = "<span>foo</span>";
    let unsubscribed = false;

    function vm(this: any) {
        this.cleanup = () => unsubscribed = true;
    }

    ui.components.register("test-component", {
        template: template,
        viewModel: vm,
    });

    expect.false(unsubscribed);
    expect.doesNotThrow(() => ui.applyBindings({ }, el));
    ui.cleanNode(el);
    expect.true(unsubscribed);
    expect.end();
});

it("component: Components are properly isolated", expect => {
    const str = `<div><test-component></test-component></div>`;
    const el = <HTMLElement> util.parse(str)[0];
    const template = `<span x-text="bar">invalid</span>`;
    const value = "baz";
    const viewModel = { foo: 42 };
    ui.components.register("test-component", {
        template: template,
        viewModel: { bar: value,
            preInit: (element: HTMLElement, ctx: IDataContext) => {
                expect.notEqual(ctx.$data, viewModel, "viewModel of component is not equal to root viewModel");
                expect.equal(ctx.$data["bar"], value);
            },
        },
    });

    expect.doesNotThrow(() => ui.applyBindings(viewModel, el));
    expect.equal(el.childNodes[0].childNodes[0].textContent, value);
    expect.end();
});

it("component: Components emit custom events", expect => {
    const str = `<test-component x-on-pulse="log"></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];
    const template = `<span>pulse</span>`;
    const emitter = new Rx.Subject<CustomEvent>();
    ui.components.register("test-component", {
        template: template,
        viewModel: { emitter },
    });
    let value = "";
    const vm = { log: (x: CustomEvent) => value = x.detail };

    expect.doesNotThrow(() => ui.applyBindings(vm, el));
    emitter.next(new CustomEvent("pulse", { detail: "myPulse" }));
    expect.equal(value, "myPulse");
    expect.end();
});

it("component: Components support basic transclusion", expect => {
    const str = `<test-component><span x-text="transclusion"></span></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];
    const template = `<header>Will it succeed?</header><slot>Oh noo!!!</slot><footer>Thank you for your patronage</footer>`;

    ui.components.register("test-component", { template: template });

    const vm = { transclusion: "Oh Yeah!!!" };

    expect.doesNotThrow(() => ui.applyBindings(vm, el));
    expect.equal(el.childNodes[1]["innerText"], vm.transclusion);
    expect.end();
});

it("component: Components support value binding", expect => {
    const str = `<test-component x-value="obs"></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<input type="text" x-value="name"/><input type="text" x-value="surname"/>`;
    const name = new Rx.BehaviorSubject("Hello");
    const surname = new Rx.BehaviorSubject("World");
    const component = { viewModel: { name, surname, value: name.combineLatest(surname, (n, s) => `${n} ${s}`) }, template: template };
    ui.components.register("test-component", component);

    const vm = { obs: new Rx.BehaviorSubject("") };

    expect.doesNotThrow(() => ui.applyBindings(vm, el));
    expect.equal("Hello World", vm.obs.getValue());
    expect.end();

});

it("component: Components support value binding", expect => {
    const str = `<test-component x-value="obs"></test-component>`;
    const el = <HTMLElement> util.parse(str)[0];

    const template = `<input type="text" x-value="name"/><input type="text" x-value="surname"/>`;
    const name = new Rx.BehaviorSubject("Hello");
    const surname = new Rx.BehaviorSubject("World");
    const component = { viewModel: { name, surname, value: name.combineLatest(surname, (n, s) => `${n} ${s}`) }, template: template };
    ui.components.register("test-component", component);

    const vm = { obs: new Rx.BehaviorSubject("") };

    expect.doesNotThrow(() => ui.applyBindings(vm, el));
    expect.equal("Hello World", vm.obs.getValue());
    expect.end();

});

it("component: Dynamic component", expect => {
    const str = `<div x-component="name"></div>`;
    const el = <HTMLElement> util.parse(str)[0];

    const t1 = `<p x-text="id">BAD</p>`;
    const t2 = `<input type="text" x-value="id"/>`;
    const c1 = { viewModel: { id: "first" }, template: t1 };
    const c2 = { viewModel: { id: "second" }, template: t2 };
    ui.components.register("test-one", c1);
    ui.components.register("test-two", c2);

    const vm = { name: new Rx.BehaviorSubject("test-one") };
    expect.doesNotThrow(() => ui.applyBindings(vm, el));

    expect.equal(el.children[0].tagName, "P");
    expect.equal(el.children[0].textContent, "first");
    vm.name.next("test-two");

    expect.equal(el.children[0].tagName, "INPUT");
    expect.equal(el.children[0]["value"], "second");

    expect.end();

});

it("component: Recursive component", expect => {
    const str = `<tree-comp x-as-well="$data"></tree-comp>`;
    const el = util.parse(str)[0] as HTMLElement;

    const t1 = `<ul>
                    <li x-for-item="$data">
                        <span x-text="item.key"></span>&nbsp<span x-if="typeof item.value !=='object'" x-text="item.value"></span>
                        <tree-comp x-if="typeof item.value ==='object'" x-as-well="item.value"></tree-comp>
                    </li>
                </ul>`;

    const c1 = { template: t1 };

    ui.components.register("tree-comp", c1);
    expect.doesNotThrow(() => ui.applyBindings({ hello: "my", baby: { hello: "my", honey: "!!!" } }, el));

    expect.equal(el.children[0].children[1].children[1].children[0].children[1].children[1].textContent, "!!!");

    expect.end();

});
