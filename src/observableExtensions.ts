import * as Rx from "rxjs";
import { ComputedValue } from "./interfaces";
import { ComputedValueImpl } from "./computed";
import { ComputedArrayImpl, ComputedArray } from "./computedArray";

declare module "rxjs/Observable" {
    export interface Observable<T> {
        toComputed(): ComputedValue<T>;
    }
}

Rx.Observable.prototype.toComputed = function<T>(): ComputedValue<T> {
    return ComputedValueImpl.createComputed<T>(this);
};
Rx.Observable.prototype["toComputedArray"] = function<T>(): ComputedArray<T> {
    return ComputedArrayImpl.createComputedArray<T>(this);
};
