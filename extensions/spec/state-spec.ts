import { Subject, of, NEVER } from "rxjs";
import { startWith } from "rxjs/operators";
import it from "ava";
import "../src/extensions";

it("source observable prefixed with startWith overrides initialValue", async t => {
    const obs = NEVER.pipe(startWith(13));
    const value = obs.toState(0);
    t.is(value.getValue(), 13);
});

it("returns the last value of the underlying observable upon creation", async t => {
    const obs = of(3);
    const value = obs.toState(3);
    t.is(value.getValue(), 3);
});

it("returns the last value of the underlying observable", async t => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    subject.next(3);
    t.is(value.getValue(), 3);
});

it("toString is equal to current value toString", async t => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    subject.next(3);
    t.is(value.toString(), value.getValue().toString());
});

it("adding data to the underlying observable results in change notifications on the value", async t => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let changedFired = false;

    value.subscribe(() => changedFired = true);
    subject.next(10);

    t.true(changedFired);
});

it("multiple subscribers receive notifications", async t => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let changedFiredCount = 0;

    // subscribe
    value.subscribe(() => changedFiredCount++);

    // subscribe again
    value.subscribe(() => changedFiredCount++);

    subject.next(10);

    t.is(changedFiredCount, 2);
});

it("notifications for changes in absence of any subscribers do not get buffered", async t => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let changedFired = false;

    subject.next(10);
    value.subscribe(() => changedFired = true);

    t.false(changedFired);
});

it("captures errors in the observable source", async t => {
    const subject = new Subject<number>();
    const value = subject.toState(0);
    let errorCount = 0;

    value.subscribe(() => {}, () => errorCount++);
    subject.error("error");

    t.is(errorCount, 1);
});

it("allows connecting an error handler at construction", async t => {
    const subject = new Subject<number>();
    let errorCount = 0;
    subject.toState(0).subscribe(() => {}, () => errorCount++);

    subject.error("error");

    t.is(errorCount, 1);
});
