﻿import * as Rx from "rxjs";
import { scan, filter } from "rxjs/operators";
import * as px from "../src/extensions";
import * as it from "tape";

it("can be created using factory method with initial value", expect => {
    const val = px.value(10);
    expect.equal(val(), 10);
    expect.end();
});

it("falsy initial values are not coerced to undefined", expect => {
    const val = px.value(0);
    expect.equal(val(), 0);

    const val2 = px.value(false);
    expect.equal(val2(), false);

    const val3 = px.value(null);
    expect.equal(val3(), null);
    expect.end();
});

it("invoking it as a function with a parameter changes the value", expect => {
    const val = px.value(0);
    val(10);
    expect.equal(val(), 10);
    expect.end();
});

it("setting value to undefined works", expect => {
    const val = px.value<number | undefined>(undefined);

    val(3);
    expect.equal(val(), 3);
    val(undefined);
    expect.true(val() === undefined);
    expect.end();
});

it("type transition", expect => {
    const val = px.value<string | number | object>(0);

    val(3);
    expect.equal(val(), 3);

    val(Rx.of(3));
    expect.equal(typeof val(), "object");

    val("foo");
    expect.equal(val(), "foo");
    expect.end();
});

it("setting a value fires change notifications", expect => {
    const val = px.value(0);
    let changedFired = false;

    val.subscribe(() => changedFired = true);
    val(10);

    expect.true(changedFired);
    expect.end();
});
it("subscribers are notified of initial value", expect => {
    const val = px.value<number>(5);
    let changed = 0;
    val.subscribe(() => changed = 5);

    expect.equal(changed, 5);
    expect.end();
});

it("all value changes before subscription are ignored, except the last", expect => {
    const val = px.value(0);
    let changed = 0;
    val(10);
    val(8);
    val.subscribe(x => changed = x);

    expect.equal(changed, 8);
    expect.end();
});

it("multiple subscribers receive notifications, initial value, then subsequent", expect => {
    const val = px.value(0);
    let changingFiredCount = 0;

    // subscribe
    val.subscribe(() => changingFiredCount++);

    // subscribe again
    val.subscribe(() => changingFiredCount++);

    val(10);

    expect.equal(changingFiredCount, 4);
    expect.end();
});

it("to Computed works", expect => {
    const val = px.value<number>(3);
    const max = val.pipe(scan((x, y) => x > y ? x : y, val())).toState(0);
    expect.equal(max.getValue(), 3);
    val(1);
    expect.equal(max.getValue(), 3);
    val(5);
    expect.equal(max.getValue(), 5);
    val(2);
    expect.equal(max.getValue(), 5);
    expect.end();
});

it("computed chaining works", expect => {
    const val = px.value(0);
    const max = val.pipe(scan((x, y) => x > y ? x : y, val())).toState(0);
    const evenMax = max.pipe(filter(x => x % 2 === 0)).toState(0);
    val(1);
    expect.equal(evenMax.getValue(), 0);
    val(6);
    expect.equal(evenMax.getValue(), 6);
    val(9);
    expect.equal(evenMax.getValue(), 6);
    expect.end();
});
it("combine 2 values", expect => {
    const val1 = px.value<number>(4);
    const val2 = px.value<number>(2);
    const ratio = Rx.combineLatest([val1, val2], (p1: number, p2: number) => p1 / p2).toState(0);
    expect.equal(ratio.getValue(), 2);
    expect.end();
});
it("value is also an observer", expect => {
    const val1 = px.value<number>(4);
    const val2 = px.value<number>(0);
    val1.subscribe(val2);
    expect.equal(val2(), 4);
    expect.end();
});
it("next sets current value", expect => {
    const val = px.value<number>(0);
    val.next(1);

    expect.equal(val(), 1);
    expect.end();
});
