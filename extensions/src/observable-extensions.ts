import { Observable } from "rxjs";
import { ObservableState } from "./state";
import { state } from "./extensions";

declare module "rxjs/Observable" {
    export interface Observable<T> {
        toState(initial: T): ObservableState<T>;
    }
}

Observable.prototype.toState = function<T>(this: Observable<T>, initial: T): ObservableState<T> {
    return state<T>(this, initial);
};
