﻿import { Subject, of, NEVER } from "rxjs";
import { startWith } from "rxjs/operators";
import * as it from "tape";
import "../src/extensions";

it("source observable prefixed with startWith overrides initialValue", expect => {
    const obs = NEVER.pipe(startWith(13));
    const value = obs.toState(0);
    expect.equal(value.getValue(), 13);
    expect.end();
});

it("returns the last value of the underlying observable upon creation", expect => {
    const obs = of(3);
    const value = obs.toState(3);
    expect.equal(value.getValue(), 3);
    expect.end();
});

it("returns the last value of the underlying observable", expect => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    subject.next(3);
    expect.equal(value.getValue(), 3);
    expect.end();
});

it("toString is equal to current value toString", expect => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    subject.next(3);
    expect.equal(value.toString(), value.getValue().toString());
    expect.end();
});

it("adding data to the underlying observable results in change notifications on the value", expect => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let changedFired = false;

    value.subscribe(() => changedFired = true);
    subject.next(10);

    expect.true(changedFired);
    expect.end();
});

it("multiple subscribers receive notifications", expect => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let changedFiredCount = 0;

    // subscribe
    value.subscribe(() => changedFiredCount++);

    // subscribe again
    value.subscribe(() => changedFiredCount++);

    subject.next(10);

    expect.equal(changedFiredCount, 2);
    expect.end();
});

it("notifications for changes in absence of any subscribers do not get buffered", expect => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let changedFired = false;

    subject.next(10);
    value.subscribe(() => changedFired = true);

    expect.false(changedFired);
    expect.end();
});

it("captures errors in the observable source", expect => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let errorCount = 0;

    value.subscribe(() => {}, () => errorCount++);
    subject.error("error");

    expect.equal(errorCount, 1);
    expect.end();
});

it("allows connecting an error handler at construction", expect => {
    const subject = new Subject<number>();
    let errorCount = 0;
    subject.toState(0).subscribe(() => {}, () => errorCount++);

    subject.error("error");

    expect.equal(errorCount, 1);
    expect.end();
});
