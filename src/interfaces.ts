import { Observable, Subscription, Observer } from "rxjs/Rx";

export interface Func<T> {
    (): T;
}
export interface Action<T> {
    (newValue: T): void;
}
export interface Disposable {
    subscription: Subscription;
}

export interface ComputedValue<T> extends Observable<T>, Func<T>, Disposable {
}

export interface ObservableValue<T> extends Observable<T>, Func<T>, Action<T>, Observer<T> {
}