import { Observable, BehaviorSubject } from "rxjs";
import "./observable-extensions";
import { ObservableState } from "./state";
import { ObservableArray } from "./array";
import { ComputedArray } from "./computed-array";

export interface Func<T> {
    (): T;
}
export interface Action<T> {
    (val: T): void;
}

export function state<T>(source: Observable<T>, initial: T): ObservableState<T> & Func<T> {
    if ("call" in source && "source" in source) {
        return source as any;
    }
    const observable = source instanceof ObservableState ? source : new ObservableState<T>(source, initial);
    return createFunction(observable) as ObservableState<T> & Func<T>;
}

export function value<T>(initial: T): BehaviorSubject<T> & Func<T> & Action<T> {
    return createFunction(new BehaviorSubject(initial)) as BehaviorSubject<T> & Func<T> & Action<T>;
}
export function array<T>(initial: T[] = []): ObservableArray<T> & Func<T> & Action<T> {
    return createFunction(new ObservableArray<T>(initial)) as ObservableArray<T> & Func<T> & Action<T>;
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

export { ObservableState, ObservableArray, ComputedArray };
