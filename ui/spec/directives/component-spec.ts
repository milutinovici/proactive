import it from "ava";
import { BehaviorSubject, combineLatest } from "rxjs";
import { IScope } from "../../src/interfaces";
import { ProactiveUI } from "../../src/ui";
import { document, fragment, parse } from "../spec-utils";

const ui = new ProactiveUI({ document });

it("component: Loads a component using simple string options", async (t) => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = parse(str)[0] as HTMLElement;

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.innerHTML, template);

});

it("component: Loads a component using its name as tag", async (t) => {
    const str = `<test-component></test-component>`;
    const el = parse(str)[0] as HTMLElement;

    const template = `<span>foo</span>`;
    ui.components.register("test-component", { template });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.innerHTML, template);

});

it("component: Loads a component through a dynamic import", async (t) => {
    const str = `<test-component foo="42"></test-component>`;
    const el = parse(str)[0] as HTMLElement;
    ui.components.register("test-component", "./dynamic-component.html");

    t.notThrows(() => ui.domManager.applyDirectives({}, el));
    setTimeout(() => {

        t.true(el.children[0] && el.children[0].textContent === "bar");

    }, 200);
});

it("component: Loads a template from a string", async (t) => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = parse(str)[0] as HTMLElement;

    const template = "<span>foo</span>";
    ui.components.register("test-component", { template });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.innerHTML, template);

});

it("component: Loads a template from a fragment", async (t) => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = parse(str)[0] as HTMLElement;

    const template = "<span>foo</span>";
    ui.components.register("test-component", {
        template: fragment(template),
    });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.innerHTML, template);

});

it("component: Loads a template from an id", async (t) => {
    const template = parse(`<template id="template1">bar</template>`)[0];
    document.body.appendChild(template);
    const str = `<div x-component="'test-component'"></div>`;
    const el = parse(str)[0] as HTMLElement;

    ui.components.register("test-component", { template: "#template1" });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.innerHTML, "bar");

});

it("component: Stateless component with a constant prop", async (t) => {
    const str = `<test-component name="John"></test-component>`;
    const el = parse(str)[0] as HTMLElement;

    const template = `<span>Hello my name is</span><span x-text="name">invalid</span>`;

    ui.components.register("test-component", { template });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.children[1].textContent, "John");

});

it("component: Stateless component with an observable prop", async (t) => {
    const str = `<test-component x-attr:name="foo"></test-component>`;
    const el = parse(str)[0] as HTMLElement;

    const template = `<span>Hello my name is</span><span x-text="name">invalid</span>`;

    ui.components.register("test-component", { template });
    const vm = { foo: new BehaviorSubject("John") };
    t.notThrows(() => ui.domManager.applyDirectives(vm, el));
    t.is(el.children[1].textContent, "John");
    vm.foo.next("Jim");
    t.is(el.children[1].textContent, "Jim");

});

it("component: props get passed to view-model constructor", async (t) => {
    const str = `<div x-component="'test-component'" foo="42"></div>`;
    const el = parse(str)[0] as HTMLElement;

    const template = `<span x-text="foo">invalid</span>`;

    // constructor
    function constr(this: any, props: any) {
        this.foo = props.foo;
    }
    ui.components.register("test-component", { template, viewmodel: constr });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.childNodes[0].textContent, "42");

});

it("component: Invokes created hook", async (t) => {
    const str = `<test-component id="fixture5" foo="42"></test-component>`;
    const el = parse(str)[0] as HTMLElement;

    const template = "<span>foo</span>";
    let invoked = false;
    const created = function(element: HTMLElement) {  // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
        invoked = true;
    };

    ui.components.register("test-component", {
        template,
        created,
    });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.true(invoked);

});

it("component: Invokes destroy hook", async (t) => {
    const str = `<test-component id="fixture5" foo="42"></test-component>`;
    const el = parse(str)[0] as HTMLElement;

    const template = "<span>foo</span>";
    let invoked = false;

    const destroy = function(element: HTMLElement) {   // don't convert this to a lambda or the test will suddenly fail due to Typescript's this-capturing
        invoked = true;
    };

    ui.components.register("test-component", {
        template,
        destroy,
    });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.false(invoked);

    ui.clean(el);
    t.true(invoked);

});

it("component: Unsubscribes a component's viewmodel if has cleanup subscription", async (t) => {
    const str = `<div x-component="'test-component'"></div>`;
    const el = parse(str)[0] as HTMLElement;
    const template = "<span>foo</span>";
    let unsubscribed = false;

    function vm(this: any) {
        this.cleanup = () => unsubscribed = true;
    }

    ui.components.register("test-component", {
        template,
        viewmodel: vm,
    });

    t.false(unsubscribed);
    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    ui.clean(el);
    t.true(unsubscribed);

});

it("component: Components are properly isolated", async (t) => {
    const str = `<div><test-component></test-component></div>`;
    const el = parse(str)[0] as HTMLElement;
    const template = `<span x-text="bar">invalid</span>`;
    const value = "baz";
    const viewmodel = { foo: 42 };
    ui.components.register("test-component", {
        template,
        viewmodel: { bar: value,
            preInit: (element: HTMLElement, scope: IScope) => {
                t.not(scope.$data, viewmodel, "viewmodel of component is not equal to root viewmodel");
                t.is(scope.$data.bar, value);
            },
        },
    });

    t.notThrows(() => ui.domManager.applyDirectives(viewmodel, el));
    t.is(el.childNodes[0].childNodes[0].textContent, value);

});
// doesn't work in jsdom
// it("component: Components emit custom events", async t => {
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

//     t.notThrows(() => ui.domManager.applyDirectives(vm, el));
//     emitter.next(new CustomEvent("pulse", { detail: "myPulse" }));
//     t.is(value, "myPulse");
//
// });

it("component: Components support basic transclusion", async (t) => {
    const str = `<test-component>Hello</test-component>`;
    const el = parse(str)[0] as HTMLElement;
    const template = `<p></p><slot>Oh noo!!!</slot><br/>`;

    ui.components.register("test-component", { template });

    t.notThrows(() => ui.domManager.applyDirectives({ }, el));
    t.is(el.childNodes[1].textContent, "Hello");

});

it("component: Components support named transclusion", async (t) => {
    const str = `<test-component><h1 slot="header">Hello</h1></test-component>`;
    const el = parse(str)[0] as HTMLElement;
    const template = `<header><slot name="header"></slot></header>
                      <main><slot>Default</slot></main>
                      <footer><slot name="footer"></slot></footer>`;

    ui.components.register("test-component", { template });

    t.notThrows(() => ui.domManager.applyDirectives({}, el));
    t.is(el.childNodes[0].childNodes[0].textContent, "Hello");

});

it("component: Components support value directive", async (t) => {
    const str = `<test-component x-value="obs"></test-component>`;
    const el = parse(str)[0] as HTMLElement;

    const template = `<input type="text" x-value="name"/><input type="text" x-value="surname"/>`;
    const name = new BehaviorSubject("Hello");
    const surname = new BehaviorSubject("World");
    const component = { viewmodel: { name, surname, value: combineLatest(name, surname, (n, s) => `${n} ${s}`) }, template };
    ui.components.register("test-component", component);

    const vm = { obs: new BehaviorSubject("") };

    t.notThrows(() => ui.domManager.applyDirectives(vm, el));
    t.is("Hello World", vm.obs.getValue());

});

it("component: Dynamic component", async (t) => {
    const str = `<div x-component="name"></div>`;
    const el = parse(str)[0] as HTMLElement;

    const t1 = `<p x-text="id">BAD</p>`;
    const t2 = `<input type="text" x-value="id"/>`;
    const c1 = { viewmodel: { id: "first" }, template: t1 };
    const c2 = { viewmodel: { id: "second" }, template: t2 };
    ui.components.register("test-one", c1);
    ui.components.register("test-two", c2);

    const vm = { name: new BehaviorSubject("test-one") };
    t.notThrows(() => ui.domManager.applyDirectives(vm, el));

    const p = el.children[0] as HTMLParagraphElement;
    t.is(p.tagName, "P", "1st template inserted");
    t.is(p.textContent, "first", "1st template correctly bound");
    vm.name.next("test-two");

    const input = el.children[0] as HTMLInputElement;
    t.is(input.tagName, "INPUT", "2nd template inserted");
    t.is(input.value, "second", "2nd template correctly bound");

});

it("component: Recursive component", async (t) => {
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
    t.notThrows(() => ui.domManager.applyDirectives({ hello: "my", baby: { hello: "my", honey: "!!!" } }, el));

    t.is(el.children[0].children[1].children[1].children[0].children[1].children[1].textContent, "!!!");

});

it("component: object passed instead of string", async (t) => {
    const str = `<div x-component="obj"></div>`;
    const el = parse(str)[0] as HTMLElement;

    const t1 = `<p x-text="greeting"></p>`;
    const c1 = {
        template: t1, viewmodel(props: object) {
            // @ts-ignore
            this.greeting = props.greeting;
        },
    };

    ui.components.register("obj-comp", c1);
    t.notThrows(() => ui.domManager.applyDirectives({ obj: { name: "obj-comp",  greeting: "hello" } }, el));

    t.is(el.children[0].textContent, "hello");

});
