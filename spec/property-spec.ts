import * as Rx from "rxjs/Rx";
import { px } from "../src/proactive";

describe("Observable Properties", () => {
    it("can be created using factory method", () => {
        let prop = px.property<number>();
        expect(prop).toBeDefined();
    });

    it("can be created using factory method with initial value", () => {
        let prop = px.property<number>(10);
        expect(prop()).toEqual(10);
    });

    it("falsy initial values are not coerced to undefined", () => {
        let prop = px.property(0);
        expect(prop()).toEqual(0);

        let prop2 = px.property(false);
        expect(prop2()).toEqual(false);

        let prop3 = px.property(null);
        expect(prop3()).toEqual(null);
    });

    it("observables are set up during creation", () => {
        let prop = px.property<number>();
        expect(prop["source"] !== undefined).toBeTruthy();
    });

    it("invoking it as a function with a parameter changes the property's value", () => {
        let prop = px.property<number>();
        prop(10);
        expect(prop()).toEqual(10);
    });

    it("setting value to undefined works", () => {
        let prop = px.property<number>();

        prop(3);
        expect(prop()).toEqual(3);
        prop(undefined);
        expect(prop()).not.toBeDefined();
    });

    it("type transition", () => {
        let prop = px.property<any>();

        prop(3);
        expect(prop()).toEqual(3);

        prop(Rx.Observable.of(3));
        expect(typeof prop()).toEqual("object");

        prop("foo");
        expect(prop()).toEqual("foo");
    });

    it("setting a value fires change notifications", () => {
        let prop = px.property<number>();
        let changedFired = false;

        prop.subscribe(x => changedFired = true);
        prop(10);

        expect(changedFired === true).toBeTruthy();
    });

    it("multiple subscribers receive notifications", () => {
        let prop = px.property<number>();
        let changingFiredCount = 0;

        // subscribe
        prop.subscribe(x => changingFiredCount++);

        // subscribe again
        prop.subscribe(x => changingFiredCount++);

        prop(10);

        expect(changingFiredCount).toEqual(2);
    });

    it("notifications for changes in absence of any subscribers do not get buffered", () => {
        let prop = px.property<number>();
        let changedFired = false;

        prop(10);
        prop.subscribe(x => changedFired = true);

        expect(changedFired === false).toBeTruthy();
    });

    it("consecutively assigning the same value does not result in duplicate change notifications", () => {
        let prop = px.property<number>();
        let changedFiredCount = 0;

        prop.subscribe(x => changedFiredCount++);
        prop(1);
        prop(2);
        prop(2);

        expect(changedFiredCount).toEqual(2);
    });

});
