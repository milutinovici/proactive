import { Observable, Subject, BehaviorSubject } from "rxjs/Rx";
import { px } from "../src/proactive";

describe("Computed Properties", () => {
    it("can be created using factory method", () => {
        let prop = Observable.never().toComputed();
        expect(prop).toBeDefined();
    });

    it("source observable prefixed with startWith overrides initialValue", () => {
        let obs = Observable.never().startWith(13);
        let prop = obs.toComputed();
        expect(prop()).toEqual(13);
    });

    it("returns the last value of the underlying observable upon creation", () => {
        let obs = Observable.of(3);
        let prop = obs.toComputed();
        expect(prop()).toEqual(3);
    });

    it("returns the last value of the underlying observable", () => {
        let subject = new Subject<number>();
        let prop = subject.toComputed();
        subject.next(3);
        expect(prop()).toEqual(3);
    });

    it("toString is equal to current value toString", () => {
        let subject = new Subject<number>();
        let prop = subject.toComputed();
        subject.next(3);
        expect(prop.toString()).toEqual(prop().toString());
    });

    it("adding data to the underlying observable results in change notifications on the property", () => {
        let subject = new Subject<number>();
        let prop = subject.toComputed();
        let changedFired = false;

        prop.subscribe(x => changedFired = true);
        subject.next(10);

        expect(changedFired === true).toBeTruthy();
    });

    it("multiple subscribers receive notifications", () => {
        let subject = new Subject<number>();
        let prop = subject.toComputed();
        let changedFiredCount = 0;

        // subscribe
        prop.subscribe(x => changedFiredCount++);

        // subscribe again
        prop.subscribe(x => changedFiredCount++);

        subject.next(10);

        expect(changedFiredCount).toEqual(2);
    });

    it("notifications for changes in absence of any subscribers do not get buffered", () => {
        let subject = new Subject<number>();
        let prop = subject.toComputed();
        let changedFired = false;

        subject.next(10);
        prop.subscribe(x => changedFired = true);

        expect(changedFired === false).toBeTruthy();
    });

    it("consecutively assigning the same value does not result in duplicate change notifications", () => {
        let subject = new Subject<number>();
        let prop = subject.toComputed();
        let changedFiredCount = 0;

        prop.subscribe(x => changedFiredCount++);
        subject.next(1);
        subject.next(2);
        subject.next(2);

        expect(changedFiredCount).toEqual(2);
    });

    it("captures errors in the observable source", () => {
        let subject = new Subject<number>();
        let prop = subject.toComputed();
        let errorCount = 0;

        prop.subscribe(x => {}, error => errorCount++);
        subject.error("error");

        expect(errorCount).toEqual(1);
    });

    it("allows connecting an error handler at construction", () => {
        let subject = new Subject<number>();
        let errorCount = 0;
        let prop = subject.toComputed().subscribe(x => {}, error => errorCount++);

        subject.error("error");

        expect(errorCount).toEqual(1);
    });
    it("calling to property 2nd time returns the same object as the 1st time", () => {
        let subject = new Subject<number>();
        let prop1 = subject.toComputed();
        let prop2 = prop1.toComputed();

        expect(prop1).toEqual(prop2);
    });

});
