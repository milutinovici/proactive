import { ObservableArray } from "../src/extensions";
import it from "ava";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";

it("should calculate length properly", async t => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.length;

    let output = 0;
    computed.subscribe(x => output = x);

    t.is(output, 4);

    origin.push("Hello");
    t.is(output, 5);

    origin.pop();
    t.is(output, 4);

    origin.unshift("Goodbye");
    t.is(output, 5);

    origin.clear();
    t.is(output, 0);
});

it("should follow base collection", async t => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.map(x => x.toUpperCase());

    let output: string[] = [];
    computed.subscribe(x => output = x);

    t.is(input.length, output.length);

    origin.push("Hello");
    t.is(5, output.length);
    t.is("Hello".toUpperCase(), output[4]);

    origin.pop();
    t.is(4, output.length);

    origin.unshift("Goodbye");
    t.is(5, output.length);
    t.is("Goodbye".toUpperCase(), output[0]);

    origin.clear();
    t.is(0, output.length);
});

it("should be filtered", async t => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.filter(x => x.toUpperCase().indexOf("F") !== -1);

    let output: string[] = [];
    computed.subscribe(x => output = x);

    t.deepEqual(output, ["Foo", "Bamf"]);

    origin.push("Boof");
    t.deepEqual(output, ["Foo", "Bamf", "Boof"]);

    origin.push("Car");
    t.deepEqual(output, ["Foo", "Bamf", "Boof"]);

    const removed = origin.remove(x => x === "Bar"); // Remove "Bar"
    t.deepEqual(output, ["Foo", "Bamf", "Boof"]);
    t.deepEqual(removed, ["Bar"]);

    origin.shift(); // Remove "Foo"
    t.deepEqual(output, ["Bamf", "Boof"]);
});

it("should be sorted", async t => {
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

    t.deepEqual(["Bar", "Baz", "Foo"], output);

    origin.push("Roo");
    t.deepEqual(["Bar", "Baz", "Foo", "Roo"], output);

    origin.push("Bar");
    t.deepEqual(["Bar", "Bar", "Baz", "Foo", "Roo"], output); 
});

it("chaining works", async t => {
    const input = ["Foo", "Bar", "Baz", "Bamf"];
    const origin = new ObservableArray(input);
    const computed = origin.map(x => x.toUpperCase()).filter(x => x.indexOf("F") !== -1);
    let output: string[] = [];
    computed.subscribe(x => output = x);

    t.deepEqual(output, ["FOO", "BAMF"]);

    origin.push("Boof");
    t.deepEqual(output, ["FOO", "BAMF", "BOOF"]);

    origin.push("Car");
    t.deepEqual(output, ["FOO", "BAMF", "BOOF"]);

    origin.remove(x => x === "Bar"); // Remove "Bar"
    t.deepEqual(output, ["FOO", "BAMF", "BOOF"]);

    origin.shift(); // Remove "Foo"
    t.deepEqual(output, ["BAMF", "BOOF"]);
});

it("should check if every element satisfies callback fn", async t => {
    const input = [1, 2, 4, 6];
    const origin = new ObservableArray(input);
    const computed = origin.every(x => x % 2 === 0);
    let output: boolean = false;
    computed.subscribe(x => output = x);

    t.false(output);

    origin.push(8);
    t.false(output);

    const removed = origin.shift(); // Remove 1
    t.is(removed, 1);
    t.true(output);

    origin.push(3);
    t.false(output);
});
it("should check if any element satisfies callback fn", async t => {
    const input = [2, 3, 5, 7];
    const origin = new ObservableArray(input);
    const computed = origin.some(x => x % 2 === 0);
    let output: boolean = false;
    computed.subscribe(x => output = x);

    t.true(output);

    origin.push(9);
    t.true(output);

    const removed = origin.shift(); // Remove 2
    t.is(removed, 2);
    t.false(output);

    origin.push(4);
    t.true(output);
});

it("should get max element of Array using reduce", async t => {
    const input = [2, 3, 5, 7, 1, 4];
    const origin = new ObservableArray(input);
    const computed = origin.reduce((x, y) => x > y ? x : y, 0);
    let output: number = 0;
    computed.subscribe(x => output = x);

    t.is(output, 7);

    origin.push(9);
    t.is(output, 9);

    const removed = origin.pop();
    t.is(removed, 9);
    t.is(output, 7);

    origin.push(4);
    t.is(output, 7);
});
it("should flatten elements using flatMap", async t => {
    const input = [[2, 3], [5, 7]];
    const origin = new ObservableArray(input);
    const computed = origin.flatMap(x => x);
    let output: number[] = [];
    computed.subscribe(x => output = x);

    t.deepEqual(output, [2, 3, 5, 7]);

    origin.push([1, 4]);
    t.deepEqual(output, [2, 3, 5, 7, 1, 4]);

    const removed = origin.shift();
    t.deepEqual(removed, [2, 3]);
    t.deepEqual(output, [5, 7, 1, 4]);

    origin.pop();
    t.deepEqual(output, [5, 7]);
});

it("should group elements using groupBy", async t => {
    const input = [2, 3, 5, 7];
    const origin = new ObservableArray(input);
    const computed = origin.groupBy(x => x % 2);
    let output = new Map<number, number[]>();
    computed.subscribe(x => output = x);

    t.deepEqual(output.get(0), [2]);
    t.deepEqual(output.get(1), [3, 5, 7]);
    origin.push(4);
    t.deepEqual(output.get(0), [2, 4]);
    t.deepEqual(output.get(1), [3, 5, 7]);

    const removed = origin.shift();
    t.deepEqual(removed, 2);
    t.deepEqual(output.get(0), [4]);
    t.deepEqual(output.get(1), [3, 5, 7]);
});

it("should filter out duplicate elements using distinct", async t => {
    const input = [3, 3, 2, 7];
    const origin = new ObservableArray(input);
    const computed = origin.distinct(x => x);
    let output: number[] = [];
    computed.subscribe(x => output = x);

    t.deepEqual(output, [3, 2, 7]);
    origin.push(4);
    t.deepEqual(output, [3, 2, 7, 4]);
    origin.push(4);
    t.deepEqual(output, [3, 2, 7, 4]);
    origin.shift();
    t.deepEqual(output, [3, 2, 7, 4]);
    origin.shift();
    t.deepEqual(output, [2, 7, 4]);
});

it("should filter higher order observables", async t => {
    const input = [new BehaviorSubject(3), new BehaviorSubject(4), new BehaviorSubject(5), new BehaviorSubject(6)];
    const origin = new ObservableArray(input);
    const computed = origin.filterx(number$ => number$.pipe(map(n => n % 2 === 0)));
    let output: BehaviorSubject<number>[] = [];
    computed.subscribe(x => output = x);

    t.is(output.length, 2);
    t.deepEqual(output[0], input[1]);

    input[0].next(2);

    t.is(output.length, 3);
    t.deepEqual(output[0], input[0]);

    const o$ = new BehaviorSubject(8);
    origin.unshift(o$);

    t.is(output.length, 4);
    t.deepEqual(output[0], o$);

    o$.next(9);

    t.is(output.length, 3);
    t.deepEqual(output[0], input[0]);
});
