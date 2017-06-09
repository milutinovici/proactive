import { Observable, BehaviorSubject } from "rxjs";
import "./observable-extensions";
import { ObservableValue, ObservableState } from "./interfaces";
import { ObservableStateImpl } from "./state";
import { ArrayImpl, ObservableArray } from "./array";
import { ComputedArray } from "./computed-array";

export function state<T>(source: Observable<T>, initial: T): ObservableState<T> {
    if ("call" in source && "source" in source) {
        return <ObservableState<T>> source;
    }
    const observable = new ObservableStateImpl<T>(source, initial);
    return createFunction(observable) as ObservableState<T>;
}

export function value<T>(initial: T): ObservableValue<T> {
    return createFunction(new BehaviorSubject(initial)) as ObservableValue<T>;
}
export function array<T>(initial: T[] = []): ObservableArray<T> {
    return createFunction(new ArrayImpl<T>(initial)) as ObservableArray<T>;
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

export { ObservableState, ObservableValue, ObservableArray, ComputedArray };
