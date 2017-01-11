import * as Rx from "rxjs";
import { ComputedArrayImpl } from "./computedArray";
import { Func, Action } from "./interfaces";

export class ArrayImpl<T> extends ComputedArrayImpl<T> implements Rx.Observer<T[]> {
    protected readonly source: Rx.BehaviorSubject<T[]>;

    constructor(initial: T[] = []) {
        super(new Rx.BehaviorSubject<T[]>(initial), initial);
    }

    public setValue(value: T[]) {
        this.value = value;
        this.source.next(value);
    }
    public next(value: T[]) {
        this.value = value;
        this.source.next(value);
    }
    public error(err: Error) {
        this.source.error(err);
    }
    public complete() {
        this.source.complete();
    }
    public [Rx.Symbol.rxSubscriber]() {
        return this;
    }
    public static createArray<T>(initial: T[]): ObservableArray<T> {
        const accessor: ArrayImpl<T> = function(value: T[]) {
            if (arguments.length > 0) {
                return accessor.setValue(value);
            } else {
                return accessor.getValue();
            }
        } as any;
        const call = accessor["call"];
        const apply = accessor["apply"];
        Object["setPrototypeOf"](accessor, new ArrayImpl(initial));
        accessor["call"] = call;
        accessor["apply"] = apply;
        return accessor as ObservableArray<T>;
    }

    public push(...items: T[]): void {
        if (items === null || items === undefined) {
            throw Error("items null/undefined");
        }
        const old = this.getValue();
        this.setValue(old.concat(items));
    }
    public pop(): T {
        const old = this.getValue();
        const last = old[old.length - 1];
        this.setValue(old.slice(0, old.length - 1));
        return last;
    }
    public unshift(...items: T[]): void {
        if (items === null || items === undefined) {
            throw Error("items null/undefined");
        }
        const old = this.getValue();
        this.setValue(items.concat(old));
    }
    public shift(): T {
        const old = this.getValue();
        const first = old[0];
        const retained = old.slice(1, old.length);
        this.setValue(retained);
        return first;
    }
    public remove(fn: (element: T) => boolean): T[] {
        const old = this.getValue();
        const removed: T[] = [];
        const retained: T[] = [];
        for (const value of old) {
            if (fn(value)) {
                removed.push(value);
            } else {
                retained.push(value);
            }
        }
        this.setValue(retained);
        return removed;
    }
    public reverse(): void {
        const old = this.getValue().slice();
        this.setValue(old.reverse());
    }
    public sort(fn: (a: T, b: T) => number): void {
        const old = this.getValue();
        const sorted: T[] = old.slice().sort(fn);
        this.setValue(sorted);
    }
    public splice(start: number, deleteCount: number): T[] {
        const old = this.getValue();
        const retained1 = old.slice(0, start);
        const retained2 = old.slice(start + deleteCount, old.length);
        const removed = old.slice(start, start + deleteCount);
        this.setValue(retained1.concat(retained2));
        return removed;
    }
    public clear(): T[] {
        const old = this.getValue();
        this.setValue(<T[]> []);
        return old;
    }

}
export interface ObservableArray<T> extends ArrayImpl<T>, Func<T[]>, Action<T[]> {
}
