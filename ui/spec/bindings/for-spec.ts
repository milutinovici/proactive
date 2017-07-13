import * as it from "tape";
import * as px from "@proactive/extensions";
import { document, parse, toArray, range } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
const ui = new ProactiveUI(document);

it("for: binding to a standard array", expect => {
    const template = `<ul><li x-for-number="array" x-text="number"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ array }, el));

    expect.equal(el.children.length, array.length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), array);
    expect.end();
});

it("for: binding to a standard array and template accessing index", expect => {
    const template = `<ul><li x-for-item-i="array" x-text="i"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ array }, el));
    expect.equal(el.children.length, array.length);

    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, array.length));
    expect.end();
});

it("for: binding to a value yielding an array", expect => {
    const template = `<ul><li x-for-item-i="src" x-text="i"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let prop = px.value<number[]>([]);

    expect.doesNotThrow(() => ui.applyBindings({ src: prop }, el));
    expect.equal(el.children.length, prop().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, prop().length));

    let list = [1, 5, 7];
    prop(list);
    expect.equal(el.children.length, prop().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, prop().length));
    expect.end();
});

it("for: binding to a observable list containing numbers", expect => {
    const template = `<ul><li x-for-item-i="array" x-text="i"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = px.array([1, 5, 7]);
    expect.doesNotThrow(() => ui.applyBindings({ array }, el));

    expect.equal(el.children.length, array().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, array().length));
    expect.end();
});

it("for: binding to a observable list containing numbers without initialContents", expect => {
    const template = `<ul><li x-for-value="src" x-text="value"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let array = px.array();

    for (let i = 0; i < 10; i++) {
        array.push(i);
    }

    expect.equal(array().length, 10);
    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));

    expect.equal(el.children.length, array().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), range(0, array().length));
    expect.end();
});

it("for: binding to a observable list adding/removing", expect => {
    const template = `<ul><li x-for-value="src" x-text="value"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let list = px.array([1, 3, 5]);
    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    list.push(7);
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    list.pop();
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    list.shift();
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    list.unshift(9);
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    expect.end();
});

it("for: binding to a observable list moving", expect => {
    const template = `<ul><li x-for-item="$data" x-text="item"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let list = px.array([1, 3, 5]);
    expect.doesNotThrow(() => ui.applyBindings(list, el));

    list.reverse();

    expect.equal(el.children.length, list().length);
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), list());
    list.reverse();
    expect.isEquivalent(toArray(el.children).map(node => parseInt(node.textContent || "")), list());
    expect.end();
});

it("for: binding to a observable list containing model", expect => {
    const template = `<ul><li x-for-item="$data">
                        <span class="part1" x-text="item.foo"></span>
                      </li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let list = px.array([ { foo: 1 }, { foo: 5 }, { foo: 7 } ]);
    expect.doesNotThrow(() => ui.applyBindings(list, el));

    expect.equal(el.children.length, list().length);
    expect.isEquivalent(toArray(el.querySelectorAll(".part1"))
        .map(node => parseInt(node.textContent || "")), list().map(x => x.foo));
    expect.end();
});

it("for: observable list of observables", expect => {
    const template = `<ul><li x-for-item="src">
                        <span class="part1" x-text="item.foo"></span>
                      </li></ul>`;
    const el = <HTMLElement> parse(template)[0];

    let list = px.array([ { foo: px.value(1) }, { foo: px.value(5) }, { foo: px.value(7) } ]);
    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    list().forEach((x) => x.foo(33));
    expect.isEquivalent(toArray(el.querySelectorAll(".part1"))
        .map(node => parseInt(node.textContent || "")), list().map(x => x.foo()));
    expect.end();
});

it("for: binds items after for", expect => {
    const template = `<ul>
                        <li x-for-item="src" x-text="item"></li>
                        <li x-text="'hello'">BAD</li>
                      </ul>`;
    const el = <HTMLElement> parse(template)[0];
    let list = [1, 2, 3];
    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    expect.isEquivalent(el.children[3].textContent, "hello");
    expect.end();
});

it("for: works on a map", expect => {
    const template = `<ul>
                        <li x-for-item="src" x-text="item.value"></li>
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
                        <li x-for-item="src" x-text="item.value" x-attr-title="item.key"></li>
                      </ul>`;
    const el = <HTMLElement> parse(template)[0];

    let obj = { hello: 1, world: 2};

    expect.doesNotThrow(() => ui.applyBindings({ src: obj }, el));

    expect.isEquivalent(el.children[0].textContent, "1");
    expect.isEquivalent(el.children[1].textContent, "2");
    expect.end();
});

it("for: cleans up after iteself", expect => {
    const template = `<ul><li x-for-item="src" x-text="item"></li></ul>`;
    const el = <HTMLElement> parse(template)[0];
    const array = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));
    expect.equal(el.children.length, 3);
    ui.cleanNode(el);
    expect.equal(el.children.length, 1);
    expect.doesNotThrow(() => ui.applyBindings({ src: array }, el));
    expect.equal(el.children.length, 3);
    expect.end();
});
