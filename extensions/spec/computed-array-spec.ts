import { ObservableArray } from "../src/extensions";
import * as it from "tape";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";

it("should calculate length properly", expect => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.length;

    let output = 0;
    computed.subscribe(x => output = x);

    expect.equal(output, 4);

    origin.push("Hello");
    expect.equal(output, 5);

    origin.pop();
    expect.equal(output, 4);

    origin.unshift("Goodbye");
    expect.equal(output, 5);

    origin.clear();
    expect.equal(output, 0);
    expect.end();
});

it("should follow base collection", expect => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.map(x => x.toUpperCase());

    let output: string[] = [];
    computed.subscribe(x => output = x);

    expect.equal(input.length, output.length);

    origin.push("Hello");
    expect.equal(5, output.length);
    expect.equal("Hello".toUpperCase(), output[4]);

    origin.pop();
    expect.equal(4, output.length);

    origin.unshift("Goodbye");
    expect.equal(5, output.length);
    expect.equal("Goodbye".toUpperCase(), output[0]);

    origin.clear();
    expect.equal(0, output.length);
    expect.end();
});

it("should be filtered", expect => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.filter(x => x.toUpperCase().indexOf("F") !== -1);

    let output: string[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, ["Foo", "Bamf"]);

    origin.push("Boof");
    expect.isEquivalent(output, ["Foo", "Bamf", "Boof"]);

    origin.push("Car");
    expect.isEquivalent(output, ["Foo", "Bamf", "Boof"]);

    const removed = origin.remove(x => x === "Bar"); // Remove "Bar"
    expect.isEquivalent(output, ["Foo", "Bamf", "Boof"]);
    expect.isEquivalent(removed, ["Bar"]);

    origin.shift(); // Remove "Foo"
    expect.isEquivalent(output, ["Bamf", "Boof"]);
    expect.end();
});

it("should be sorted", expect => {
    const input = ["Foo", "Bar", "Baz"];
    const origin = new ObservableArray(input);

    const stringOrderer = (a: string, b: string) => {
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
    };

    const computed = origin.sorted(stringOrderer);
    let output: string[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(["Bar", "Baz", "Foo"], output);

    origin.push("Roo");
    expect.isEquivalent(["Bar", "Baz", "Foo", "Roo"], output);

    origin.push("Bar");
    expect.isEquivalent(["Bar", "Bar", "Baz", "Foo", "Roo"], output);
    expect.end();
});

it("chaining works", expect => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.map(x => x.toUpperCase()).filter(x => x.indexOf("F") !== -1);
    let output: string[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, ["FOO", "BAMF"]);

    origin.push("Boof");
    expect.isEquivalent(output, ["FOO", "BAMF", "BOOF"]);

    origin.push("Car");
    expect.isEquivalent(output, ["FOO", "BAMF", "BOOF"]);

    origin.remove(x => x === "Bar"); // Remove "Bar"
    expect.isEquivalent(output, ["FOO", "BAMF", "BOOF"]);

    origin.shift(); // Remove "Foo"
    expect.isEquivalent(output, ["BAMF", "BOOF"]);
    expect.end();
});

it("should check if every element satisfies callback fn", expect => {
    const input = [1, 2, 4, 6];
    const origin = new ObservableArray(input);
    const computed = origin.every(x => x % 2 === 0);
    let output: boolean = false;
    computed.subscribe(x => output = x);

    expect.false(output);

    origin.push(8);
    expect.false(output);

    const removed = origin.shift(); // Remove 1
    expect.equal(removed, 1);
    expect.true(output);

    origin.push(3);
    expect.false(output);
    expect.end();
});
it("should check if any element satisfies callback fn", expect => {
    const input = [2, 3, 5, 7];
    const origin = new ObservableArray(input);
    const computed = origin.some(x => x % 2 === 0);
    let output: boolean = false;
    computed.subscribe(x => output = x);

    expect.true(output);

    origin.push(9);
    expect.true(output);

    const removed = origin.shift(); // Remove 2
    expect.equal(removed, 2);
    expect.false(output);

    origin.push(4);
    expect.true(output);
    expect.end();
});
it("should get max element of Array using reduce", expect => {
    const input = [2, 3, 5, 7, 1, 4];
    const origin = new ObservableArray(input);
    const computed = origin.reduce((x, y) => x > y ? x : y, 0);
    let output: number = 0;
    computed.subscribe(x => output = x);

    expect.equal(output, 7);

    origin.push(9);
    expect.equal(output, 9);

    const removed = origin.pop();
    expect.equal(removed, 9);
    expect.equal(output, 7);

    origin.push(4);
    expect.equal(output, 7);
    expect.end();
});
it("should flatten elements using flatMap", expect => {
    const input = [[2, 3], [5, 7]];
    const origin = new ObservableArray(input);
    const computed = origin.flatMap(x => x);
    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [2, 3, 5, 7]);

    origin.push([1, 4]);
    expect.isEquivalent(output, [2, 3, 5, 7, 1, 4]);

    const removed = origin.shift();
    expect.isEquivalent(removed, [2, 3]);
    expect.isEquivalent(output, [5, 7, 1, 4]);

    origin.pop();
    expect.isEquivalent(output, [5, 7]);
    expect.end();
});

it("should group elements using groupBy", expect => {
    const input = [2, 3, 5, 7];
    const origin = new ObservableArray(input);
    const computed = origin.groupBy(x => x % 2);
    let output = new Map<number, number[]>();
    computed.subscribe(x => output = x);

    expect.isEquivalent(output.get(0), [2]);
    expect.isEquivalent(output.get(1), [3, 5, 7]);
    origin.push(4);
    expect.isEquivalent(output.get(0), [2, 4]);
    expect.isEquivalent(output.get(1), [3, 5, 7]);

    const removed = origin.shift();
    expect.isEquivalent(removed, 2);
    expect.isEquivalent(output.get(0), [4]);
    expect.isEquivalent(output.get(1), [3, 5, 7]);

    expect.end();
});

it("should filter out duplicate elements using distinct", expect => {
    const input = [3, 3, 2, 7];
    const origin = new ObservableArray(input);
    const computed = origin.distinct(x => x);
    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [3, 2, 7]);
    origin.push(4);
    expect.isEquivalent(output, [3, 2, 7, 4]);
    origin.push(4);
    expect.isEquivalent(output, [3, 2, 7, 4]);
    origin.shift();
    expect.isEquivalent(output, [3, 2, 7, 4]);
    origin.shift();
    expect.isEquivalent(output, [2, 7, 4]);

    expect.end();
});

it("should filter higher order observables", expect => {
    const input = [new BehaviorSubject(3), new BehaviorSubject(4), new BehaviorSubject(5), new BehaviorSubject(6)];
    const origin = new ObservableArray(input);
    const computed = origin.filterx(number$ => number$.pipe(map(n => n % 2 === 0)));
    let output: BehaviorSubject<number>[] = [];
    computed.subscribe(x => output = x);

    expect.equal(output.length, 2);
    expect.isEquivalent(output[0], input[1]);

    input[0].next(2);

    expect.equal(output.length, 3);
    expect.isEquivalent(output[0], input[0]);

    const o$ = new BehaviorSubject(8);
    origin.unshift(o$);

    expect.equal(output.length, 4);
    expect.isEquivalent(output[0], o$);

    o$.next(9);

    expect.equal(output.length, 3);
    expect.isEquivalent(output[0], input[0]);
    expect.end();
});
