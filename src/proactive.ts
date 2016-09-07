import "./observableExtensions";
import { Observable } from "rxjs";
import { ObservableValue, ComputedValue } from "./interfaces";
import { ObservableValueImpl } from "./value";
import { ArrayImpl, ObservableArray } from "./array";
import { ComputedArrayImpl, ComputedArray } from "./computedArray";

export function value<T>(initial: T = undefined): ObservableValue<T> {
    return ObservableValueImpl.createValue(initial);
}
export function array<T>(initial: T[] = []): ObservableArray<T> {
    return ArrayImpl.createArray(initial);
}
export function whenAny<T>(observables: Observable<Observable<T>[]>): ComputedArray<T> {
    return ComputedArrayImpl.whenAny(observables);
}
export { ComputedValue, ObservableValue, ObservableArray, ComputedArray  }