import { Observable } from "rxjs/Observable";
import { ComputedValue } from "./interfaces";
import { ComputedValueImpl } from "./computed";
import { ComputedArrayImpl, ComputedArray } from "./computedArray";

declare module "rxjs/Observable" {
    export interface Observable<T> {
        toComputed(): ComputedValue<T>;
    }
}

Observable.prototype.toComputed = function<T>(): ComputedValue<T> {
    return ComputedValueImpl.createComputed<T>(this);
};
Observable.prototype["toComputedArray"] = function<T>(): ComputedArray<T> {
    return ComputedArrayImpl.createComputedArray<T>(this);
};