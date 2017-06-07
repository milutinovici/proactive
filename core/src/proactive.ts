import { Observable, BehaviorSubject } from "rxjs";
import "./observableExtensions";
import { ObservableValue, ComputedValue } from "./interfaces";
import { StatefulObservable } from "./computed";
import { ArrayImpl, ObservableArray } from "./array";
import { ComputedArray } from "./computedArray";

export function computed<T>(source: Observable<T>, initial: T): ComputedValue<T> {
    if ("call" in source && "source" in source) {
        return <ComputedValue<T>> source;
    }
    const stateful = new StatefulObservable<T>(source, initial);
    return createFunction(stateful) as ComputedValue<T>;
}

export function value<T>(initial: T): ObservableValue<T> {
    return createFunction(new BehaviorSubject(initial)) as ObservableValue<T>;
}
export function array<T>(initial: T[] = []): ObservableArray<T> {
    return createFunction(new ArrayImpl(initial)) as ObservableArray<T>;
}
export function whenAny<T>(observables: Observable<Observable<T>[]>): ComputedArray<T> {
    return ComputedArray._whenAny(observables);
}

function createFunction<T>(observable: Observable<T>): Observable<T> {
    const accessor = function(value: T) {
        if (arguments.length > 0) {
            return accessor.next(value);
        } else {
            return accessor.getValue();
        }
    } as any;
    const call = accessor["call"];
    const apply = accessor["apply"];
    Object["setPrototypeOf"](accessor, observable);
    accessor["call"] = call;
    accessor["apply"] = apply;
    return accessor;
}

export { ComputedValue, ObservableValue, ObservableArray, ComputedArray };
