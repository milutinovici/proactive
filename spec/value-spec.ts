import * as Rx from "rxjs/Rx";
import * as px from "../src/proactive";

describe("Observable Values", () => {
    it("can be created using factory method", () => {
        const val = px.value<number>();
        expect(val).toBeDefined();
    });

    it("can be created using factory method with initial value", () => {
        const val = px.value<number>(10);
        expect(val()).toEqual(10);
    });

    it("falsy initial values are not coerced to undefined", () => {
        const val = px.value(0);
        expect(val()).toEqual(0);

        const val2 = px.value(false);
        expect(val2()).toEqual(false);

        const val3 = px.value(null);
        expect(val3()).toEqual(null);
    });

    it("observables are set up during creation", () => {
        const val = px.value<number>();
        expect(val["source"]).toBeDefined();
    });

    it("invoking it as a function with a parameter changes the valerty's value", () => {
        const val = px.value<number>();
        val(10);
        expect(val()).toEqual(10);
    });

    it("setting value to undefined works", () => {
        const val = px.value<number>();

        val(3);
        expect(val()).toEqual(3);
        val(undefined);
        expect(val()).not.toBeDefined();
    });

    it("type transition", () => {
        const val = px.value<any>();

        val(3);
        expect(val()).toEqual(3);

        val(Rx.Observable.of(3));
        expect(typeof val()).toEqual("object");

        val("foo");
        expect(val()).toEqual("foo");
    });

    it("setting a value fires change notifications", () => {
        const val = px.value<number>();
        let changedFired = false;

        val.subscribe(x => changedFired = true);
        val(10);

        expect(changedFired === true).toBeTruthy();
    });
    it("subscribers are notified of initial value", () => {
        const val = px.value<number>(5);
        let changed = 0;
        val.subscribe(x => changed = 5);

        expect(changed).toEqual(5);
    });

    it("all value changes before subscription are ignored, except the last", () => {
        const val = px.value<number>();
        let changed = 0;
        val(10);
        val(8);
        val.subscribe(x => changed = x);

        expect(changed).toEqual(8);
    });

    it("multiple subscribers receive notifications, initial value, then subsequent", () => {
        const val = px.value<number>();
        let changingFiredCount = 0;

        // subscribe
        val.subscribe(x => changingFiredCount++);

        // subscribe again
        val.subscribe(x => changingFiredCount++);

        val(10);

        expect(changingFiredCount).toEqual(4);
    });

    it("consecutively assigning the same value does not result in duplicate change notifications", () => {
        const val = px.value<number>(1);
        let changedFiredCount = 0;

        val.subscribe(x => changedFiredCount++);
        val(1);
        val(2);
        val(2);

        expect(changedFiredCount).toEqual(2);
    });

    it("to Computed works", () => {
        const val = px.value<number>(3);
        const max = val.scan((x, y) => x > y ? x : y, val()).toComputed();
        expect(max()).toEqual(3);
        val(1);
        expect(max()).toEqual(3);
        val(5);
        expect(max()).toEqual(5);
        val(2);
        expect(max()).toEqual(5);
    });

    it("computed chaining works", () => {
        const val = px.value<number>();
        const max = val.scan((x, y) => x > y ? x : y, val()).toComputed();
        const evenMax = max.filter(x => x % 2 === 0).toComputed();
        val(1);
        expect(evenMax()).toEqual(undefined);
        val(6);
        expect(evenMax()).toEqual(6);
        val(9);
        expect(evenMax()).toEqual(6);
    });
    it("combine 2 valerties", () => {
        const val1 = px.value<number>(4);
        const val2 = px.value<number>(2);
        const ratio = val1.combineLatest(val2, (p1: number, p2: number) => p1 / p2).toComputed();
        expect(ratio()).toEqual(2);
    });
    it("valerty is also an observer", () => {
        const val1 = px.value<number>(4);
        const val2 = px.value<number>();
        val1.subscribe(val2);
        expect(val2()).toEqual(4);
    });
});
