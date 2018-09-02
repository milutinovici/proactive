import { whenAny, ObservableArray } from "../src/extensions";
import it from "ava";
import { BehaviorSubject } from "rxjs";

it("map array of observables", async t => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).map(x => x * x);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    t.deepEqual(output, [1, 4, 9]);
    origin.push(new BehaviorSubject(4));
    t.deepEqual(output, [1, 4, 9, 16]);
    input[0].next(5);
    t.deepEqual(output, [25, 4, 9, 16]);
});

it("filter array of observables", async t => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).filter(x => x % 2 === 0);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    t.deepEqual(output, [2]);
    origin.push(new BehaviorSubject(4));
    t.deepEqual(output, [2, 4]);
    input[0].next(6);
    t.deepEqual(output, [6, 2, 4]);
});

it("map & filter array of observables", async t => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).filter(x => x % 2 === 0).map(x => x * x);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    t.deepEqual(output, [4]);
    origin.push(new BehaviorSubject(4));
    t.deepEqual(output, [4, 16]);
    input[0].next(6);
    t.deepEqual(output, [36, 4, 16]);
});

it("reduce array of observables", async t => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).reduce((x, y) => x > y ? x : y, 0);

    let output: number = 0;
    computed.subscribe(x => output = x);

    t.is(output, 3);
    origin.push(new BehaviorSubject(4));
    t.is(output, 4);
    input[0].next(6);
    t.is(output, 6);
});
