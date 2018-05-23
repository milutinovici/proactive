import { whenAny, ObservableArray } from "../src/extensions";
import * as it from "tape";
import { BehaviorSubject } from "rxjs";

it("map array of observables", expect => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).map(x => x * x);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [1, 4, 9]);
    origin.push(new BehaviorSubject(4));
    expect.isEquivalent(output, [1, 4, 9, 16]);
    input[0].next(5);
    expect.isEquivalent(output, [25, 4, 9, 16]);
    expect.end();
});
it("filter array of observables", expect => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).filter(x => x % 2 === 0);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [2]);
    origin.push(new BehaviorSubject(4));
    expect.isEquivalent(output, [2, 4]);
    input[0].next(6);
    expect.isEquivalent(output, [6, 2, 4]);
    expect.end();
});
it("map & filter array of observables", expect => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).filter(x => x % 2 === 0).map(x => x * x);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [4]);
    origin.push(new BehaviorSubject(4));
    expect.isEquivalent(output, [4, 16]);
    input[0].next(6);
    expect.isEquivalent(output, [36, 4, 16]);
    expect.end();
});
it("reduce array of observables", expect => {
    const input = [new BehaviorSubject(1), new BehaviorSubject(2), new BehaviorSubject(3)];
    const origin = new ObservableArray(input);
    const computed = origin.whenAny(x => x).reduce((x, y) => x > y ? x : y, 0);

    let output: number = 0;
    computed.subscribe(x => output = x);

    expect.equal(output, 3);
    origin.push(new BehaviorSubject(4));
    expect.equal(output, 4);
    input[0].next(6);
    expect.equal(output, 6);
    expect.end();
});
