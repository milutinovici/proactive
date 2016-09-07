import { Observable, Subscription, Symbol } from "rxjs/Rx";
import { PartialObserver } from "rxjs/Observer";
import { Func, Disposable, ComputedValue } from "./interfaces";

export class ComputedValueImpl<T> extends Observable<T> {
    protected source: Observable<T>;
    protected value: T;

    constructor(source: Observable<T>, initial?: T) {
        super();
        this.value = initial;
        this.source = source.distinctUntilChanged();
    }

    subscribe(observerOrNext?: PartialObserver<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Subscription {
        return this.source.subscribe(observerOrNext, error, complete);
    }
    getValue(): T {
        return this.value;
    }
    static createComputed<T>(source: Observable<T>): ComputedValue<T> {
        if ("call" in source && "source" in source) {
            return <ComputedValue<T>>source;
        }
        const accessor: any = function(): T {
            return accessor.getValue();
        };
        const observable = new ComputedValueImpl(source);
        for (const attrname in observable) {
            accessor[attrname] = observable[attrname];
        }
        accessor.subscription = accessor.subscribe((val: T) => accessor.value = val, console.error);
        accessor[Symbol.observable] = () => accessor;
        return accessor;
    }
    toString(): string {
        return this.getValue().toString();
    }
}