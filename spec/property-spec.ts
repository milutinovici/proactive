import * as Rx from "rxjs/Rx";
import * as px from "../src/proactive";

describe("Observable Properties", () => {
    it("can be created using factory method", () => {
        const prop = px.property<number>();
        expect(prop).toBeDefined();
    });

    it("can be created using factory method with initial value", () => {
        const prop = px.property<number>(10);
        expect(prop()).toEqual(10);
    });

    it("falsy initial values are not coerced to undefined", () => {
        const prop = px.property(0);
        expect(prop()).toEqual(0);

        const prop2 = px.property(false);
        expect(prop2()).toEqual(false);

        const prop3 = px.property(null);
        expect(prop3()).toEqual(null);
    });

    it("observables are set up during creation", () => {
        const prop = px.property<number>();
        expect(prop["source"]).toBeDefined();
    });

    it("invoking it as a function with a parameter changes the property's value", () => {
        const prop = px.property<number>();
        prop(10);
        expect(prop()).toEqual(10);
    });

    it("setting value to undefined works", () => {
        const prop = px.property<number>();

        prop(3);
        expect(prop()).toEqual(3);
        prop(undefined);
        expect(prop()).not.toBeDefined();
    });

    it("type transition", () => {
        const prop = px.property<any>();

        prop(3);
        expect(prop()).toEqual(3);

        prop(Rx.Observable.of(3));
        expect(typeof prop()).toEqual("object");

        prop("foo");
        expect(prop()).toEqual("foo");
    });

    it("setting a value fires change notifications", () => {
        const prop = px.property<number>();
        let changedFired = false;

        prop.subscribe(x => changedFired = true);
        prop(10);

        expect(changedFired === true).toBeTruthy();
    });
    it("subscribers are notified of initial value", () => {
        const prop = px.property<number>(5);
        let changed = 0;
        prop.subscribe(x => changed = 5);

        expect(changed).toEqual(5);
    });

    it("all value changes before subscription are ignored, except the last", () => {
        const prop = px.property<number>();
        let changed = 0;
        prop(10);
        prop(8);
        prop.subscribe(x => changed = x);

        expect(changed).toEqual(8);
    });

    it("multiple subscribers receive notifications, initial value, then subsequent", () => {
        const prop = px.property<number>();
        let changingFiredCount = 0;

        // subscribe
        prop.subscribe(x => changingFiredCount++);

        // subscribe again
        prop.subscribe(x => changingFiredCount++);

        prop(10);

        expect(changingFiredCount).toEqual(4);
    });

    it("consecutively assigning the same value does not result in duplicate change notifications", () => {
        const prop = px.property<number>(1);
        let changedFiredCount = 0;

        prop.subscribe(x => changedFiredCount++);
        prop(1);
        prop(2);
        prop(2);

        expect(changedFiredCount).toEqual(2);
    });

    it("to Computed works", () => {
        const prop = px.property<number>(3);
        const max = prop.scan((x, y) => x > y ? x : y, prop()).toComputed();
        expect(max()).toEqual(3);
        prop(1);
        expect(max()).toEqual(3);
        prop(5);
        expect(max()).toEqual(5);
        prop(2);
        expect(max()).toEqual(5);
    });

    it("computed chaining works", () => {
        const prop = px.property<number>();
        const max = prop.scan((x, y) => x > y ? x : y, prop()).toComputed();
        const evenMax = max.filter(x => x % 2 === 0).toComputed();
        prop(1);
        expect(evenMax()).toEqual(undefined);
        prop(6);
        expect(evenMax()).toEqual(6);
        prop(9);
        expect(evenMax()).toEqual(6);
    });
    it("combine 2 properties", () => {
        const prop1 = px.property<number>(4);
        const prop2 = px.property<number>(2);
        const ratio = prop1.combineLatest(prop2, (p1: number, p2: number) => p1 / p2).toComputed();
        expect(ratio()).toEqual(2);
    });
});
