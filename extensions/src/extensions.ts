import { Observable } from "rxjs";
import "./observable-extensions";
import { ObservableState } from "./state";
import { ObservableArray } from "./array";
import { ComputedArray } from "./computed-array";

declare module "rxjs/internal/Observable" {
    export interface Observable<T> {
        toState(initial: T): ObservableState<T>;
    }
}

Observable.prototype.toState = function<T>(this: Observable<T>, initial: T): ObservableState<T> {
    return new ObservableState(this, initial);
};

export function whenAny<T>(observables: Observable<Observable<T>[]>): ComputedArray<T> {
    return ComputedArray.whenAny(observables);
}

export { ObservableState, ObservableArray, ComputedArray };
