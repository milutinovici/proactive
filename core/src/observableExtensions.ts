import { Observable } from "rxjs";
import { ComputedValue } from "./interfaces";
import { computed } from "./proactive";

declare module "rxjs/Observable" {
    export interface Observable<T> {
        toComputed(initial: T): ComputedValue<T>;
    }
}

Observable.prototype.toComputed = function<T>(this: Observable<T>, initial: T): ComputedValue<T> {
    return computed<T>(this, initial);
};

