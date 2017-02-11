import * as px from "../src/proactive";
import * as it from "tape";

it("should follow base collection", expect => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = px.array(input);
    const output = origin.mapArray(x => x.toUpperCase());

    expect.equal(input.length, output().length);

    origin.push("Hello");
    expect.equal(5, output().length);
    expect.equal("Hello".toUpperCase(), output()[4]);

    origin.pop();
    expect.equal(4, output().length);

    origin.unshift("Goodbye");
    expect.equal(5, output().length);
    expect.equal("Goodbye".toUpperCase(), output()[0]);

    origin.clear();
    expect.equal(0, output().length);
    expect.end();
});

it("should be filtered", expect => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = px.array(input);
    const output = origin.filterArray(x => x.toUpperCase().indexOf("F") !== -1);
    expect.isEquivalent(output(), ["Foo", "Bamf"]);

    origin.push("Boof");
    expect.isEquivalent(output(), ["Foo", "Bamf", "Boof"]);

    origin.push("Car");
    expect.isEquivalent(output(), ["Foo", "Bamf", "Boof"]);

    const removed = origin.remove(x => x === "Bar"); // Remove "Bar"
    expect.isEquivalent(output(), ["Foo", "Bamf", "Boof"]);
    expect.isEquivalent(removed, ["Bar"]);

    origin.shift(); // Remove "Foo"
    expect.isEquivalent(output(), ["Bamf", "Boof"]);
    expect.end();
});

it("should be sorted", expect => {
    const input = ["Foo", "Bar", "Baz"];
    const origin = px.array<string>(input);

    const stringOrderer = (a: any, b: any) => {
        if (a.toString() < b.toString()) return -1;
        if (a.toString() > b.toString()) return 1;
        return 0;
    };

    const output = origin.sortArray(stringOrderer);

    expect.isEquivalent(["Bar", "Baz", "Foo"], output());

    origin.push("Roo");
    expect.isEquivalent(["Bar", "Baz", "Foo", "Roo"], output());

    origin.push("Bar");
    expect.isEquivalent(["Bar", "Bar", "Baz", "Foo", "Roo"], output());
    expect.end();
});

it("chaining works", expect => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = px.array(input);
    const output = origin.mapArray(x => x.toUpperCase()).filterArray(x => x.indexOf("F") !== -1);
    expect.isEquivalent(output(), ["FOO", "BAMF"]);

    origin.push("Boof");
    expect.isEquivalent(output(), ["FOO", "BAMF", "BOOF"]);

    origin.push("Car");
    expect.isEquivalent(output(), ["FOO", "BAMF", "BOOF"]);

    origin.remove(x => x === "Bar"); // Remove "Bar"
    expect.isEquivalent(output(), ["FOO", "BAMF", "BOOF"]);

    origin.shift(); // Remove "Foo"
    expect.isEquivalent(output(), ["BAMF", "BOOF"]);
    expect.end();
});

it("should check if every element satisfies selector", expect => {
    const input = [1, 2, 4, 6];
    const origin = px.array(input);
    const output = origin.everyArray(x => x % 2 === 0);
    expect.false(output());

    origin.push(8);
    expect.false(output());

    const removed = origin.shift(); // Remove 1
    expect.equal(removed, 1);
    expect.true(output());

    origin.push(3);
    expect.false(output());
    expect.end();
});
it("should check if any element satisfies selector", expect => {
    const input = [2, 3, 5, 7];
    const origin = px.array(input);
    const output = origin.someArray(x => x % 2 === 0);
    expect.true(output());

    origin.push(9);
    expect.true(output());

    const removed = origin.shift(); // Remove 2
    expect.equal(removed, 2);
    expect.false(output());

    origin.push(4);
    expect.true(output());
    expect.end();
});
it("should get max element of Array using reduce", expect => {
    const input = [2, 3, 5, 7, 1, 4];
    const origin = px.array(input);
    const output = origin.reduceArray((x, y) => x > y ? x : y, 0);
    expect.equal(output(), 7);

    origin.push(9);
    expect.equal(output(), 9);

    const removed = origin.pop();
    expect.equal(removed, 9);
    expect.equal(output(), 7);

    origin.push(4);
    expect.equal(output(), 7);
    expect.end();
});
it("should flatten elements using flatMap", expect => {
    const input = [[2, 3], [5, 7]];
    const origin = px.array(input);
    const output = origin.flatMapArray(x => x);
    expect.isEquivalent(output(), [2, 3, 5, 7]);

    origin.push([1, 4]);
    expect.isEquivalent(output(), [2, 3, 5, 7, 1, 4]);

    const removed = origin.shift();
    expect.isEquivalent(removed, [2, 3]);
    expect.isEquivalent(output(), [5, 7, 1, 4]);

    origin.pop();
    expect.isEquivalent(output(), [5, 7]);
    expect.end();
});
