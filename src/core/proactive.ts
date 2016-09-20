import * as Rx from "rxjs";
import "./observableExtensions";
import { ObservableValue, ComputedValue } from "./interfaces";
import { ObservableValueImpl } from "./value";
import { ArrayImpl, ObservableArray } from "./array";
import { ComputedArrayImpl, ComputedArray } from "./computedArray";

export function value<T>(initial?: T): ObservableValue<T> {
    return ObservableValueImpl.createValue(initial);
}
export function array<T>(initial: T[] = []): ObservableArray<T> {
    return ArrayImpl.createArray(initial);
}
export function whenAny<T>(observables: Rx.Observable<Rx.Observable<T>[]>): ComputedArray<T> {
    return ComputedArrayImpl.whenAny(observables);
}
export { ComputedValue, ObservableValue, ObservableArray, ComputedArray };
