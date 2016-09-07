import { Observable, Subject, BehaviorSubject } from "rxjs/Rx";
import * as px from "../src/proactive";

describe("Computed Values", () => {
    it("can be created using factory method", () => {
        let value = Observable.never().toComputed();
        expect(value).toBeDefined();
    });

    it("source observable prefixed with startWith overrides initialValue", () => {
        let obs = Observable.never().startWith(13);
        let value = obs.toComputed();
        expect(value()).toEqual(13);
    });

    it("returns the last value of the underlying observable upon creation", () => {
        let obs = Observable.of(3);
        let value = obs.toComputed();
        expect(value()).toEqual(3);
    });

    it("returns the last value of the underlying observable", () => {
        let subject = new Subject<number>();
        let value = subject.toComputed();
        subject.next(3);
        expect(value()).toEqual(3);
    });

    it("toString is equal to current value toString", () => {
        let subject = new Subject<number>();
        let value = subject.toComputed();
        subject.next(3);
        expect(value.toString()).toEqual(value().toString());
    });

    it("adding data to the underlying observable results in change notifications on the value", () => {
        let subject = new Subject<number>();
        let value = subject.toComputed();
        let changedFired = false;

        value.subscribe(x => changedFired = true);
        subject.next(10);

        expect(changedFired === true).toBeTruthy();
    });

    it("multiple subscribers receive notifications", () => {
        let subject = new Subject<number>();
        let value = subject.toComputed();
        let changedFiredCount = 0;

        // subscribe
        value.subscribe(x => changedFiredCount++);

        // subscribe again
        value.subscribe(x => changedFiredCount++);

        subject.next(10);

        expect(changedFiredCount).toEqual(2);
    });

    it("notifications for changes in absence of any subscribers do not get buffered", () => {
        let subject = new Subject<number>();
        let value = subject.toComputed();
        let changedFired = false;

        subject.next(10);
        value.subscribe(x => changedFired = true);

        expect(changedFired === false).toBeTruthy();
    });

    it("consecutively assigning the same value does not result in duplicate change notifications", () => {
        let subject = new Subject<number>();
        let value = subject.toComputed();
        let changedFiredCount = 0;

        value.subscribe(x => changedFiredCount++);
        subject.next(1);
        subject.next(2);
        subject.next(2);

        expect(changedFiredCount).toEqual(2);
    });

    it("captures errors in the observable source", () => {
        let subject = new Subject<number>();
        let value = subject.toComputed();
        let errorCount = 0;

        value.subscribe(x => {}, error => errorCount++);
        subject.error("error");

        expect(errorCount).toEqual(1);
    });

    it("allows connecting an error handler at construction", () => {
        let subject = new Subject<number>();
        let errorCount = 0;
        let value = subject.toComputed().subscribe(x => {}, error => errorCount++);

        subject.error("error");

        expect(errorCount).toEqual(1);
    });
    it("calling to valueerty 2nd time returns the same object as the 1st time", () => {
        let subject = new Subject<number>();
        let value1 = subject.toComputed();
        let value2 = value1.toComputed();

        expect(value1).toEqual(value2);
    });

});
