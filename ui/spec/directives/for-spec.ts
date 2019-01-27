import { ObservableArray } from "@proactive/extensions";
import it from "ava";
import { BehaviorSubject } from "rxjs";
import { ProactiveUI } from "../../src/ui";
import { document, parse, range, toArray } from "../spec-utils";
const ui = new ProactiveUI({ document });

it("for: bind to a standard array", async (t) => {
    const template = `<ul><li x-for:number="array" x-text="number"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array = [1, 5, 7];

    t.notThrows(() => ui.domManager.applyDirectives({ array }, el));

    t.is(el.children.length, array.length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), array);

});

it("for: bind to a standard array and template accessing index", async (t) => {
    const template = `<ul><li x-for:item.i="array" x-text="i"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array = [1, 5, 7];

    t.notThrows(() => ui.domManager.applyDirectives({ array }, el));
    t.is(el.children.length, array.length);

    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), range(0, array.length));

});

it("for: bind to a value yielding an array", async (t) => {
    const template = `<ul><li x-for:item.i="src" x-text="i"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const prop = new BehaviorSubject<number[]>([]);

    t.notThrows(() => ui.domManager.applyDirectives({ src: prop }, el));
    t.is(el.children.length, prop.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), range(0, prop.getValue().length));

    const array = [1, 5, 7];
    prop.next(array);
    t.is(el.children.length, prop.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), range(0, prop.getValue().length));

});

it("for: bind to an observable array containing numbers", async (t) => {
    const template = `<ul><li x-for:item.i="array" x-text="i"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array =  new BehaviorSubject<number[]>([1, 5, 7]);
    t.notThrows(() => ui.domManager.applyDirectives({ array }, el));

    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), range(0, array.getValue().length));

});

it("for: bind to an observable array containing numbers without initialContents", async (t) => {
    const template = `<ul><li x-for:value="src" x-text="value"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array = new ObservableArray<number>([]);

    for (let i = 0; i < 10; i++) {
        array.push(i);
    }

    t.is(array.getValue().length, 10);
    t.notThrows(() => ui.domManager.applyDirectives({ src: array }, el));

    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), range(0, array.getValue().length));

});

it("for: bind to an observable array adding/removing", async (t) => {
    const template = `<ul><li x-for:value="src" x-text="value"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array = new ObservableArray([1, 3, 5]);
    t.notThrows(() => ui.domManager.applyDirectives({ src: array }, el));

    array.push(7);
    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), array.getValue());

    array.pop();
    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), array.getValue());

    array.shift();
    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), array.getValue());

    array.unshift(9);
    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), array.getValue());


});

it("for: bind to an observable array moving", async (t) => {
    const template = `<ul><li x-for:item="$data" x-text="item"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array = new ObservableArray([1, 3, 5]);
    t.notThrows(() => ui.domManager.applyDirectives(array, el));

    array.reverse();

    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), array.getValue());
    array.reverse();
    t.deepEqual(toArray(el.children).map((node) => parseInt(node.textContent || "")), array.getValue());

});

it("for: bind to an observable array containing model", async (t) => {
    const template = `<ul><li x-for:item="$data">
                        <span class="part1" x-text="item.foo"></span>
                      </li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array = new ObservableArray([ { foo: 1 }, { foo: 5 }, { foo: 7 } ]);
    t.notThrows(() => ui.domManager.applyDirectives(array, el));

    t.is(el.children.length, array.getValue().length);
    t.deepEqual(toArray(el.querySelectorAll(".part1"))
        .map((node) => parseInt(node.textContent || "")), array.getValue().map((x) => x.foo));

});

it("for: bind to an observable array of observables", async (t) => {
    const template = `<ul><li x-for:item="src">
                        <span class="part1" x-text="item.foo"></span>
                      </li></ul>`;
    const el = parse(template)[0] as HTMLElement;

    const array = new ObservableArray([ { foo: new BehaviorSubject(1) }, { foo: new BehaviorSubject(5) }, { foo: new BehaviorSubject(7) } ]);
    t.notThrows(() => ui.domManager.applyDirectives({ src: array }, el));

    array.getValue().forEach((x) => x.foo.next(33));
    t.deepEqual(toArray(el.querySelectorAll(".part1"))
        .map((node) => parseInt(node.textContent || "")), array.getValue().map((x) => x.foo.getValue()));

});

it("for: binds items after for", async (t) => {
    const template = `<ul>
                        <li x-for:item="src" x-text="item"></li>
                        <li x-text="'hello'">BAD</li>
                      </ul>`;
    const el = parse(template)[0] as HTMLElement;
    const array = [1, 2, 3];
    t.notThrows(() => ui.domManager.applyDirectives({ src: array }, el));

    t.deepEqual(el.children[3].textContent, "hello");

});

it("for: bind to a map", async (t) => {
    const template = `<ul>
                        <li x-for:item="src" x-text="item.value"></li>
                      </ul>`;
    const el = parse(template)[0] as HTMLElement;
    const map = new Map();
    map.set(1, "hello");
    map.set(2, "world");

    t.notThrows(() => ui.domManager.applyDirectives({ src: map }, el));

    t.deepEqual(el.children[0].textContent, "hello");
    t.deepEqual(el.children[1].textContent, "world");

});

it("for: bind to an object", async (t) => {
    const template = `<ul>
                        <li x-for:item="src" x-text="item.value" x-attr:title="item.key"></li>
                      </ul>`;
    const el = parse(template)[0] as HTMLElement;

    const obj = { hello: 1, world: 2};

    t.notThrows(() => ui.domManager.applyDirectives({ src: obj }, el));

    t.deepEqual(el.children[0].textContent, "1");
    t.deepEqual(el.children[1].textContent, "2");

});

it("for: cleans up after iteself", async (t) => {
    const template = `<ul><li x-for:item="src" x-text="item"></li></ul>`;
    const el = parse(template)[0] as HTMLElement;
    const array = [1, 5, 7];

    t.notThrows(() => ui.domManager.applyDirectives({ src: array }, el));
    t.is(el.children.length, 3);
    ui.clean(el);
    t.is(el.children.length, 1);
    t.notThrows(() => ui.domManager.applyDirectives({ src: array }, el));
    t.is(el.children.length, 3);

});
