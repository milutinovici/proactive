import * as it from "tape";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/app";
import * as util from "../spec-utils";

it("binding to a standard array", expect => {
    const template = `<ul><li x-repeat="src" x-text="$data"></li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    expect.equal(el.children.length, list.length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), list);
    expect.end();
});

it("binding to a standard array and template accessing index", expect => {
    const template = `<ul><li x-repeat="src" x-text="$index"></li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = [1, 5, 7];

    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));
    expect.equal(el.children.length, list.length);

    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), util.range(0, list.length));
    expect.end();
});

it("binding to a value yielding an array", expect => {
    const template = `<ul><li x-repeat="src" x-text="$index"></li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let prop = px.value<number[]>([]);

    expect.doesNotThrow(() => ui.applyBindings({ src: prop }, el));
    expect.equal(el.children.length, prop().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), util.range(0, prop().length));

    let list = [1, 5, 7];
    prop(list);
    expect.equal(el.children.length, prop().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), util.range(0, prop().length));
    expect.end();
});

it("binding to a observable list containing numbers", expect => {
    const template = `<ul><li x-repeat="src" x-text="$index"></li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = px.array([1, 5, 7]);
    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), util.range(0, list().length));
    expect.end();
});

it("binding to a observable list containing numbers without initialContents", expect => {
    const template = `<ul><li x-repeat="src" x-text="$data"></li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = px.array();

    for (let i = 0; i < 10; i++) {
        list.push(i);
    }

    expect.equal(list().length, 10);
    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), util.range(0, list().length));
    expect.end();
});

it("binding to a observable list adding/removing", expect => {
    const template = `<ul><li x-repeat="src" x-text="$data"></li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = px.array([1, 3, 5]);
    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    list.push(7);
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    list.pop();
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    list.shift();
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    list.unshift(9);
    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), list());

    expect.end();
});

it("binding to a observable list moving", expect => {
    const template = `<ul><li x-repeat="$data" x-text="$data"></li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = px.array([1, 3, 5]);
    expect.doesNotThrow(() => ui.applyBindings(list, el));

    list.reverse();

    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), list());
    list.reverse();
    expect.isEquivalent(util.toArray(el.children).map(node => parseInt(node.textContent || "")), list());
    expect.end();
});

it("binding to a observable list containing model", expect => {
    const template = `<ul><li x-repeat="$data">
                        <span class="part1" x-text="foo"></span>
                      </li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = px.array([ { foo: 1 }, { foo: 5 }, { foo: 7 } ]);
    expect.doesNotThrow(() => ui.applyBindings(list, el));

    expect.equal(el.children.length, list().length);
    expect.isEquivalent(util.toArray(el.querySelectorAll(".part1"))
        .map(node => parseInt(node.textContent || "")), list().map(x => x.foo));
    expect.end();
});

it("observable list of observables", expect => {
    const template = `<ul><li x-repeat="src">
                        <span class="part1" x-text="foo"></span>
                      </li></ul>`;
    const el = <HTMLElement> util.parse(template)[0];

    let list = px.array([ { foo: px.value(1) }, { foo: px.value(5) }, { foo: px.value(7) } ]);
    expect.doesNotThrow(() => ui.applyBindings({ src: list }, el));

    list().forEach((x) => x.foo(33));
    expect.isEquivalent(util.toArray(el.querySelectorAll(".part1"))
        .map(node => parseInt(node.textContent || "")), list().map(x => x.foo()));
    expect.end();
});
