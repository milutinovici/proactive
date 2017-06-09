import { Observable } from "rxjs";
import { StatefulObservable } from "./interfaces";
import { stateful } from "./proactive";

declare module "rxjs/Observable" {
    export interface Observable<T> {
        toStateful(initial: T): StatefulObservable<T>;
    }
}

Observable.prototype.toStateful = function<T>(this: Observable<T>, initial: T): StatefulObservable<T> {
    return stateful<T>(this, initial);
};
