import { Observable } from "rxjs/Observable";
import { Computed } from "./interfaces";
import { ComputedObservable } from "./computed";
import { ComputedListObservable, ComputedList } from "./computedList";

declare module "rxjs/Observable" {
    export interface Observable<T> {
        toComputed(): Computed<T>;
    }
}

Observable.prototype.toComputed = function<T>(): Computed<T> {
    return ComputedObservable.createComputed<T>(this);
};
Observable.prototype["toComputedList"] = function<T>(): ComputedList<T> {
    return ComputedListObservable.createComputedList<T>(this);
};