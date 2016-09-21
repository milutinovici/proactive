import * as Rx from "rxjs";
import * as px from "../../src/core/proactive";
import * as it from "tape";

it("can be created using factory method", expect => {
    const val = px.value<number>();
    expect.true(val !== undefined);
    expect.end();
});

it("can be created using factory method with initial value", expect => {
    const val = px.value<number>(10);
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

it("observables are set up during creation", expect => {
    const val = px.value<number>();
    expect.true(val["source"] !== undefined);
    expect.end();
});

it("invoking it as a function with a parameter changes the valerty's value", expect => {
    const val = px.value<number>();
    val(10);
    expect.equal(val(), 10);
    expect.end();
});

it("setting value to undefined works", expect => {
    const val = px.value<number | undefined>();

    val(3);
    expect.equal(val(), 3);
    val(undefined);
    expect.true(val() === undefined);
    expect.end();
});

it("type transition", expect => {
    const val = px.value<any>();

    val(3);
    expect.equal(val(), 3);

    val(Rx.Observable.of(3));
    expect.equal(typeof val(), "object");

    val("foo");
    expect.equal(val(), "foo");
    expect.end();
});

it("setting a value fires change notifications", expect => {
    const val = px.value<number>();
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
    const val = px.value<number>();
    let changed = 0;
    val(10);
    val(8);
    val.subscribe(x => changed = x);

    expect.equal(changed, 8);
    expect.end();
});

it("multiple subscribers receive notifications, initial value, then subsequent", expect => {
    const val = px.value<number>();
    let changingFiredCount = 0;

    // subscribe
    val.subscribe(() => changingFiredCount++);

    // subscribe again
    val.subscribe(() => changingFiredCount++);

    val(10);

    expect.equal(changingFiredCount, 4);
    expect.end();
});

it("consecutively assigning the same value does not result in duplicate change notifications", expect => {
    const val = px.value<number>(1);
    let changedFiredCount = 0;

    val.subscribe(() => changedFiredCount++);
    val(1);
    val(2);
    val(2);

    expect.equal(changedFiredCount, 2);
    expect.end();
});

it("to Computed works", expect => {
    const val = px.value<number>(3);
    const max = val.scan((x, y) => x > y ? x : y, val()).toComputed();
    expect.equal(max(), 3);
    val(1);
    expect.equal(max(), 3);
    val(5);
    expect.equal(max(), 5);
    val(2);
    expect.equal(max(), 5);
    expect.end();
});

it("computed chaining works", expect => {
    const val = px.value<number>();
    const max = val.scan((x, y) => x > y ? x : y, val()).toComputed();
    const evenMax = max.filter(x => x % 2 === 0).toComputed();
    val(1);
    expect.equal(evenMax(), undefined);
    val(6);
    expect.equal(evenMax(), 6);
    val(9);
    expect.equal(evenMax(), 6);
    expect.end();
});
it("combine 2 values", expect => {
    const val1 = px.value<number>(4);
    const val2 = px.value<number>(2);
    const ratio = val1.combineLatest(val2, (p1: number, p2: number) => p1 / p2).toComputed();
    expect.equal(ratio(), 2);
    expect.end();
});
it("value is also an observer", expect => {
    const val1 = px.value<number>(4);
    const val2 = px.value<number>();
    val1.subscribe(val2);
    expect.equal(val2(), 4);
    expect.end();
});
