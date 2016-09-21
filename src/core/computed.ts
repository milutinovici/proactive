import * as Rx from "rxjs";
import { ComputedValue } from "./interfaces";

export class ComputedValueImpl<T> extends Rx.Observable<T> {
    protected source: Rx.Observable<T>;
    protected value: T;

    constructor(source: Rx.Observable<T>, initial?: T) {
        super();
        this.value = initial;
        this.source = source.distinctUntilChanged();
    }

    public subscribe(observerOrNext?: Rx.Observer<T> | ((value: T) => void), error?: (error: Error) => void, complete?: () => void): Rx.Subscription {
        return this.source.subscribe(observerOrNext, error, complete);
    }
    public getValue(): T {
        return this.value;
    }
    public static createComputed<T>(source: Rx.Observable<T>): ComputedValue<T> {
        if ("call" in source && "source" in source) {
            return <ComputedValue<T>> source;
        }
        const accessor: any = function(): T {
            return accessor.getValue();
        };
        const observable = new ComputedValueImpl(source);
        for (const attrname in observable) {
            accessor[attrname] = observable[attrname];
        }
        accessor.subscription = accessor.subscribe((val: T) => accessor.value = val, console.error);
        accessor[Rx.Symbol.observable] = () => accessor;
        return accessor;
    }
    public toString(): string {
        return `${this.getValue()}`;
    }
}