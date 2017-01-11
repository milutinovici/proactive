import * as Rx from "rxjs";
import { ComputedValue } from "./interfaces";

export class ComputedValueImpl<T> extends Rx.Observable<T> {
    protected readonly source: Rx.Observable<T>;
    protected value: T;

    constructor(source: Rx.Observable<T>, initial: T) {
        super();
        this.value = initial;
        this.source = source.distinctUntilChanged();
    }
    public subscribe(): Rx.Subscription;
    public subscribe(observer: Rx.Observer<T>): Rx.Subscription;
    public subscribe(next?: (value: T) => void, error?: (error: any) => void, complete?: () => void): Rx.Subscription;
    public subscribe(observerOrNext?: Rx.Observer<T> | ((value: T) => void), error?: (error: any) => void, complete?: () => void): Rx.Subscription {
            return this.source.subscribe(observerOrNext as any, error, complete);
    }
    public getValue(): T {
        return this.value;
    }
    public static createComputed<T>(source: Rx.Observable<T>, initial: T): ComputedValue<T> {
        if ("call" in source && "source" in source) {
            return <ComputedValue<T>> source;
        }
        const accessor: ComputedValueImpl<T> = (() => accessor.getValue()) as any;
        const call = accessor["call"];
        const apply = accessor["apply"];
        Object["setPrototypeOf"](accessor, new ComputedValueImpl(source, initial));
        accessor["call"] = call;
        accessor["apply"] = apply;
        accessor["subscription"] = accessor.subscribe(val => accessor.value = val, console.error);
        return accessor as any;
    }
    public toString(): string {
        return `${this.getValue()}`;
    }
}
