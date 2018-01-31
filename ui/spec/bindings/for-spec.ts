import * as it from "tape";
import { BehaviorSubject } from "rxjs";
import { ObservableArray } from "@proactive/extensions";
import { document, parse, toArray, range } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
const ui = new ProactiveUI({ document });

it("for: binding to a standard array", expect => {
    const template = `<ul><li x-for:number="array" x-text="number"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ array }, el));

    expect.equal(el.children.length, array.length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array);
    expect.end();
});

it("for: binding to a standard array and template accessing index", expect => {
    const template = `<ul><li x-for:item:i="array" x-text="i"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ array }, el));
    expect.equal(el.children.length, array.length);

    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, array.length));
    expect.end();
});

it("for: binding to a value yielding an array", expect => {
    const template = `<ul><li x-for:item:i="src" x-text="i"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let prop = new BehaviorSubject<number[]>([]);

    expect.doesNotThrow(() => ui.applyBindings({ src: prop }, el));
    expect.equal(el.children.length, prop.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, prop.getValue().length));

    let array = [1, 5, 7];
    prop.next(array);
    expect.equal(el.children.length, prop.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, prop.getValue().length));
    expect.end();
});

it("for: binding to a observable array containing numbers", expect => {
    const template = `<ul><li x-for:item:i="array" x-text="i"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array =  new BehaviorSubject<number[]>([1, 5, 7]);
    expect.doesNotThrow(() => ui.applyBindings({ array }, el));

    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, array.getValue().length));
    expect.end();
});

it("for: binding to a observable array containing numbers without initialContents", expect => {
    const template = `<ul><li x-for:value="src" x-text="value"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = new ObservableArray<number>([]);

    for (let i = 0; i < 10; i++) {
        array.push(i);
    }

    expect.equal(array.getValue().length, 10);
    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));

    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, array.getValue().length));
    expect.end();
});

it("for: binding to a observable array adding/removing", expect => {
    const template = `<ul><li x-for:value="src" x-text="value"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = new ObservableArray([1, 3, 5]);
    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));

    array.push(7);
    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array.getValue());

    array.pop();
    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array.getValue());

    array.shift();
    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array.getValue());

    array.unshift(9);
    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array.getValue());

    expect.end();
});

it("for: binding to a observable array moving", expect => {
    const template = `<ul><li x-for:item="$data" x-text="item"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = new ObservableArray([1, 3, 5]);
    expect.doesNotThrow(() => ui.applyBindings(array, el));

    array.reverse();

    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array.getValue());
    array.reverse();
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array.getValue());
    expect.end();
});

it("for: binding to a observable array containing model", expect => {
    const template = `<ul><li x-for:item="$data">
                        <span class="part1" x-text="item.foo"></span>
                      </li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = new ObservableArray([ { foo: 1 }, { foo: 5 }, { foo: 7 } ]);
    expect.doesNotThrow(() => ui.applyBindings(array, el));

    expect.equal(el.children.length, array.getValue().length);
    expect.isEquivalent(toArray(el.querySelectorAll(".part1"))
        .map(node => parseInt(node.textContent || "")), array.getValue().map(x => x.foo));
    expect.end();
});

it("for: observable array of observables", expect => {
    const template = `<ul><li x-for:item="src">
                        <span class="part1" x-text="item.foo"></span>
                      </li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = new ObservableArray([ { foo: new BehaviorSubject(1) }, { foo: new BehaviorSubject(5) }, { foo: new BehaviorSubject(7) } ]);
    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));

    array.getValue().forEach((x) => x.foo.next(33));
    expect.isEquivalent(toArray(el.querySelectorAll(".part1"))
        .map(node => parseInt(node.textContent || "")), array.getValue().map(x => x.foo.getValue()));
    expect.end();
});

it("for: binds items after for", expect => {
    const template = `<ul>
                        <li x-for:item="src" x-text="item"></li>
                        <li x-text="'hello'">BAD</li>
                      </ul>`;
    const el = <HTMLElement> parse(template)[0];
    let array = [1, 2, 3];
    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));

    expect.isEquivalent(el.children[3].textContent, "hello");
    expect.end();
});

it("for: works on a map", expect => {
    const template = `<ul>
                        <li x-for:item="src" x-text="item.value"></li>
                      </ul>`;
    const el = <HTMLElement> parse(template)[0];
    let map = new Map();
    map.set(1, "hello");
    map.set(2, "world");

    expect.doesNotThrow(() => ui.applyBindings({ src: map }, el));

    expect.isEquivalent(el.children[0].textContent, "hello");
    expect.isEquivalent(el.children[1].textContent, "world");
    expect.end();
});

it("for: works on an object", expect => {
    const template = `<ul>
                        <li x-for:item="src" x-text="item.value" x-attr-title="item.key"></li>
                      </ul>`;
    const el = <HTMLElement> parse(template)[0];

    let obj = { hello: 1, world: 2};

    expect.doesNotThrow(() => ui.applyBindings({ src: obj }, el));

    expect.isEquivalent(el.children[0].textContent, "1");
    expect.isEquivalent(el.children[1].textContent, "2");
    expect.end();
});

it("for: cleans up after iteself", expect => {
    const template = `<ul><li x-for:item="src" x-text="item"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];
    const array = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));
    expect.equal(el.children.length, 3);
    ui.clean(el);
    expect.equal(el.children.length, 1);
    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));
    expect.equal(el.children.length, 3);
    expect.end();
});
