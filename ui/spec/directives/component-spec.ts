import * as it from "tape";
import { IScope } from "../../src/interfaces";
import { document, parse, fragment } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
import { BehaviorSubject } from "rxjs/BehaviorSubject";

const ui = new ProactiveUI({ document });

it("component: Loads a component using simple string options", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a component using its name as tag", expect => {
    const str = `<test-component></test-component>`;
    const el = <HTMLElement> parse(str)[0];

    const template = `<span>foo</span>`;
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a component through an AMD module loader", expect => {
    const str = `<div x-component="'test-component'" foo="42"></div>`;
    const el = <HTMLElement> parse(str)[0];
    ui.components.register("test-component", "src/ui/components/my-select");

    document["vmHook"] = (props: any) => {
        expect.isNotEqual(props, undefined);
        expect.equal(props.foo, 42);

        // now install new hook
        document["vmHook"] = () => {
            delete document["vmHook"];

            expect.equal((<HTMLElement> el.children[0]).childNodes[0].textContent, "bar");
            expect.end();
        };
    };

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.end();
});

it("component: Loads a template from a string", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a template from a fragment", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> parse(str)[0];

    const template = "<span>foo</span>";
    ui.components.register("test-component", {
        template: fragment(template),
    });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.innerHTML, template);
    expect.end();
});

it("component: Loads a template from an id", expect => {
    const template =  parse(`<span style="display:none;" id="template1">bar</span>`)[0];
    document.body.appendChild(template);
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> parse(str)[0];

    ui.components.register("test-component", { template: "#template1" });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.innerHTML, "bar");
    expect.end();
});

it("component: Stateless component with a constant prop", expect => {
    const str = `<test-component name="John"></test-component>`;
    const el = <HTMLElement> parse(str)[0];

    const template = `<span>Hello my name is</span><span x-text="name">invalid</span>`;

    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.children[1].textContent, "John");
    expect.end();
});

it("component: Stateless component with an observable prop", expect => {
    const str = `<test-component x-attr:name="foo"></test-component>`;
    const el = <HTMLElement> parse(str)[0];

    const template = `<span>Hello my name is</span><span x-text="name">invalid</span>`;

    ui.components.register("test-component", { template: template });
    const vm = { foo: new BehaviorSubject("John") };
    expect.doesNotThrow(() => ui.domManager.applyDirectives(vm, el));
    expect.equal(el.children[1].textContent, "John");
    vm.foo.next("Jim");
    expect.equal(el.children[1].textContent, "Jim");
    expect.end();
});

it("component: props get passed to view-model constructor", expect => {
    const str = `<div x-component="'test-component'" foo="42"></div>`;
    const el = <HTMLElement> parse(str)[0];

    const template = `<span x-text="foo">invalid</span>`;

    // constructor 
    function constr(this: any, props: any) {
        this.foo = props.foo;
    }
    ui.components.register("test-component", { template: template, viewmodel: constr });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.childNodes[0].textContent, "42");
    expect.end();
});

it("component: Invokes created hook", expect => {
    const str = `<test-component id="fixture5" foo="42"></test-component>`;
    const el = <HTMLElement> parse(str)[0];

    const template = "<span>foo</span>";
    let invoked = false;
    const created = function (element: HTMLElement) {  // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
        invoked = true;
    };

    ui.components.register("test-component", {
        template: template,
        created: created,
    });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.true(invoked);
    expect.end();
});

it("component: Invokes destroy hook", expect => {
    const str = `<test-component id="fixture5" foo="42"></test-component>`;
    const el = <HTMLElement> parse(str)[0];

    const template = "<span>foo</span>";
    let invoked = false;

    const destroy = function (element: HTMLElement) {   // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
        invoked = true;
    };

    ui.components.register("test-component", {
        template: template,
        destroy,
    });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.false(invoked);

    ui.clean(el);
    expect.true(invoked);

    expect.end();
});

it("component: Unsubscribes a component's viewmodel if has cleanup subscription", expect => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = <HTMLElement> parse(str)[0];
    const template = "<span>foo</span>";
    let unsubscribed = false;

    function vm(this: any) {
        this.cleanup = () => unsubscribed = true;
    }

    ui.components.register("test-component", {
        template: template,
        viewmodel: vm,
    });

    expect.false(unsubscribed);
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    ui.clean(el);
    expect.true(unsubscribed);
    expect.end();
});

it("component: Components are properly isolated", expect => {
    const str = `<div><test-component></test-component></div>`;
    const el = <HTMLElement> parse(str)[0];
    const template = `<span x-text="bar">invalid</span>`;
    const value = "baz";
    const viewmodel = { foo: 42 };
    ui.components.register("test-component", {
        template: template,
        viewmodel: { bar: value,
            preInit: (element: HTMLElement, scope: IScope) => {
                expect.notEqual(scope.$data, viewmodel, "viewmodel of component is not equal to root viewmodel");
                expect.equal(scope.$data["bar"], value);
            },
        },
    });

    expect.doesNotThrow(() => ui.domManager.applyDirectives(viewmodel, el));
    expect.equal(el.childNodes[0].childNodes[0].textContent, value);
    expect.end();
});
// doesn't work in jsdom
// it("component: Components emit custom events", expect => {
//     const str = `<test-component x-on-pulse="log"></test-component>`;
//     const el = <HTMLElement> parse(str)[0];
//     const template = `<span>pulse</span>`;
//     const emitter = new Subject<CustomEvent>();
//     ui.components.register("test-component", {
//         template: template,
//         viewmodel: { emitter },
//     });
//     let value = "";
//     const vm = { log: (x: CustomEvent) => value = x.detail };

//     expect.doesNotThrow(() => ui.domManager.applyDirectives(vm, el));
//     emitter.next(new CustomEvent("pulse", { detail: "myPulse" }));
//     expect.equal(value, "myPulse");
//     expect.end();
// });

it("component: Components support basic transclusion", expect => {
    const str = `<test-component>Hello</test-component>`;
    const el = <HTMLElement> parse(str)[0];
    const template = `<p></p><slot>Oh noo!!!</slot><br/>`;

    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({ }, el));
    expect.equal(el.childNodes[1].textContent, "Hello");
    expect.end();
});

it("component: Components support named transclusion", expect => {
    const str = `<test-component><h1 slot="header">Hello</h1></test-component>`;
    const el = <HTMLElement> parse(str)[0];
    const template = `<header><slot name="header"></slot></header>
                      <main><slot>Default</slot></main>
                      <footer><slot name="footer"></slot></footer>`;

    ui.components.register("test-component", { template: template });

    expect.doesNotThrow(() => ui.domManager.applyDirectives({}, el));
    expect.equal(el.childNodes[0].childNodes[0].textContent, "Hello");
    expect.end();
});

it("component: Components support value directive", expect => {
    const str = `<test-component x-value="obs"></test-component>`;
    const el = <HTMLElement> parse(str)[0];

    const template = `<input type="text" x-value="name"/><input type="text" x-value="surname"/>`;
    const name = new BehaviorSubject("Hello");
    const surname = new BehaviorSubject("World");
    const component = { viewmodel: { name, surname, value: name.combineLatest(surname, (n, s) => `${n} ${s}`) }, template: template };
    ui.components.register("test-component", component);

    const vm = { obs: new BehaviorSubject("") };

    expect.doesNotThrow(() => ui.domManager.applyDirectives(vm, el));
    expect.equal("Hello World", vm.obs.getValue());
    expect.end();
});

it("component: Dynamic component", expect => {
    const str = `<div x-component="name"></div>`;
    const el = <HTMLElement> parse(str)[0];

    const t1 = `<p x-text="id">BAD</p>`;
    const t2 = `<input type="text" x-value="id"/>`;
    const c1 = { viewmodel: { id: "first" }, template: t1 };
    const c2 = { viewmodel: { id: "second" }, template: t2 };
    ui.components.register("test-one", c1);
    ui.components.register("test-two", c2);

    const vm = { name: new BehaviorSubject("test-one") };
    expect.doesNotThrow(() => ui.domManager.applyDirectives(vm, el));

    expect.equal(el.children[0].tagName, "P", "1st template inserted");
    expect.equal(el.children[0].textContent, "first", "1st template correctly bound");
    vm.name.next("test-two");

    expect.equal(el.children[0].tagName, "INPUT", "2nd template inserted");
    expect.equal(el.children[0]["value"], "second", "2nd template correctly bound");

    expect.end();
});

it("component: Recursive component", expect => {
    const str = `<tree-comp x-attr:vm="$data"></tree-comp>`;
    const el = parse(str)[0] as HTMLElement;

    const t1 = `<ul>
                    <li x-for:item="$data">
                        <span x-text="item.key"></span>&nbsp<span x-if="typeof item.value !=='object'" x-text="item.value"></span>
                        <tree-comp x-if="typeof item.value ==='object'" x-attr:vm="item.value"></tree-comp>
                    </li>
                </ul>`;

    const c1 = { template: t1 };

    ui.components.register("tree-comp", c1);
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ hello: "my", baby: { hello: "my", honey: "!!!" } }, el));

    expect.equal(el.children[0].children[1].children[1].children[0].children[1].children[1].textContent, "!!!");

    expect.end();
});

it("component: object passed instead of string", expect => {
    const str = `<div x-component="obj"></div>`;
    const el = parse(str)[0] as HTMLElement;

    const t1 = `<p x-text="greeting"></p>`;
    const c1 = {
        template: t1, viewmodel: function(props: object) {
            // @ts-ignore
            this["greeting"] = props["greeting"];
        },
    };

    ui.components.register("obj-comp", c1);
    expect.doesNotThrow(() => ui.domManager.applyDirectives({ obj: { name: "obj-comp",  greeting: "hello" } }, el));

    expect.equal(el.children[0].textContent, "hello");

    expect.end();
});
