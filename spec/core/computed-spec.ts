import * as Rx from "rxjs";
import * as px from "../../src/core/proactive";
import * as it from "tape";

it("can be created using factory method", expect => {
    const value = Rx.Observable.never().toComputed();
    expect.true(value !== undefined);
    expect.end();
});

it("source observable prefixed with startWith overrides initialValue", expect => {
    const obs = Rx.Observable.never().startWith(13);
    const value = obs.toComputed();
    expect.equal(value(), 13);
    expect.end();
});

it("returns the last value of the underlying observable upon creation", expect => {
    const obs = Rx.Observable.of(3);
    const value = obs.toComputed();
    expect.equal(value(), 3);
    expect.end();
});

it("returns the last value of the underlying observable", expect => {
    const subject = new Rx.Subject<number>();
    const value = subject.toComputed();
    subject.next(3);
    expect.equal(value(), 3);
    expect.end();
});

it("toString is equal to current value toString", expect => {
    const subject = new Rx.Subject<number>();
    const value = subject.toComputed();
    subject.next(3);
    expect.equal(value.toString(), value().toString());
    expect.end();
});

it("adding data to the underlying observable results in change notifications on the value", expect => {
    const subject = new Rx.Subject<number>();
    const value = subject.toComputed();
    let changedFired = false;

    value.subscribe(x => changedFired = true);
    subject.next(10);

    expect.true(changedFired);
    expect.end();
});

it("multiple subscribers receive notifications", expect => {
    const subject = new Rx.Subject<number>();
    const value = subject.toComputed();
    let changedFiredCount = 0;

    // subscribe
    value.subscribe(x => changedFiredCount++);

    // subscribe again
    value.subscribe(x => changedFiredCount++);

    subject.next(10);

    expect.equal(changedFiredCount, 2);
    expect.end();
});

it("notifications for changes in absence of any subscribers do not get buffered", expect => {
    const subject = new Rx.Subject<number>();
    const value = subject.toComputed();
    let changedFired = false;

    subject.next(10);
    value.subscribe(x => changedFired = true);

    expect.false(changedFired);
    expect.end();
});

it("consecutively assigning the same value does not result in duplicate change notifications", expect => {
    const subject = new Rx.Subject<number>();
    const value = subject.toComputed();
    let changedFiredCount = 0;

    value.subscribe(x => changedFiredCount++);
    subject.next(1);
    subject.next(2);
    subject.next(2);

    expect.equal(changedFiredCount, 2);
    expect.end();
});

it("captures errors in the observable source", expect => {
    const subject = new Rx.Subject<number>();
    const value = subject.toComputed();
    let errorCount = 0;

    value.subscribe(x => {}, error => errorCount++);
    subject.error("error");

    expect.equal(errorCount, 1);
    expect.end();
});

it("allows connecting an error handler at construction", expect => {
    const subject = new Rx.Subject<number>();
    let errorCount = 0;
    const value = subject.toComputed().subscribe(x => {}, error => errorCount++);

    subject.error("error");

    expect.equal(errorCount, 1);
    expect.end();
});
it("calling to valueerty 2nd time returns the same object as the 1st time", expect => {
    const subject = new Rx.Subject<number>();
    const value1 = subject.toComputed();
    const value2 = value1.toComputed();

    expect.equal(value1, value2);
    expect.end();
});
