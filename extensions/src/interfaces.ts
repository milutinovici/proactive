import { Observable, Subscription, Observer } from "rxjs";

export interface Func<T> {
    (): T;
}
export interface Action<T> {
    (val: T): void;
}
export interface Disposable {
    subscription: Subscription;
}

export interface ObservableState<T> extends Observable<T>, Func<T>, Disposable {
}

export interface ObservableValue<T> extends Observable<T>, Func<T>, Action<T>, Observer<T> {
}
