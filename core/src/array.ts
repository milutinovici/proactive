import * as Rx from "rxjs";
import { ComputedArray } from "./computedArray";
import { Func, Action } from "./interfaces";

export class ArrayImpl<T> extends ComputedArray<T> implements Rx.Observer<T[]> {
    protected readonly source: Rx.BehaviorSubject<T[]>;
    constructor(initial: T[] = []) {
        super(new Rx.BehaviorSubject<T[]>(initial));
    }

    public next(value: T[]) {
        this.source.next(value);
    }
    public error(err: Error) {
        this.source.error(err);
    }
    public complete() {
        this.source.complete();
    }
    public [Rx.Symbol.rxSubscriber]() {
        return new Rx.Subscriber<T[]>(this);
    }
    public getValue(): T[] {
        return this.source.getValue();
    }
    public push(...items: T[]): void {
        if (items === null || items === undefined) {
            throw Error("items null/undefined");
        }
        const old = this.source.getValue();
        this.next(old.concat(items));
    }
    public pop(): T {
        const old = this.source.getValue();
        const last = old[old.length - 1];
        this.next(old.slice(0, old.length - 1));
        return last;
    }
    public unshift(...items: T[]): void {
        if (items === null || items === undefined) {
            throw Error("items null/undefined");
        }
        const old = this.source.getValue();
        this.next(items.concat(old));
    }
    public shift(): T {
        const old = this.source.getValue();
        const first = old[0];
        const retained = old.slice(1, old.length);
        this.next(retained);
        return first;
    }
    public remove(fn: (element: T) => boolean): T[] {
        const old = this.source.getValue();
        const removed: T[] = [];
        const retained: T[] = [];
        for (const value of old) {
            if (fn(value)) {
                removed.push(value);
            } else {
                retained.push(value);
            }
        }
        this.next(retained);
        return removed;
    }
    public reverse(): void {
        const old = this.source.getValue().slice();
        this.next(old.reverse());
    }
    public sort(fn: (a: T, b: T) => number): void {
        const old = this.source.getValue();
        const sorted: T[] = old.slice().sort(fn);
        this.next(sorted);
    }
    public splice(start: number, deleteCount: number): T[] {
        const old = this.source.getValue();
        const retained1 = old.slice(0, start);
        const retained2 = old.slice(start + deleteCount, old.length);
        const removed = old.slice(start, start + deleteCount);
        this.next(retained1.concat(retained2));
        return removed;
    }
    public clear(): T[] {
        const old = this.source.getValue();
        this.next(<T[]> []);
        return old;
    }

}
export interface ObservableArray<T> extends ArrayImpl<T>, Func<T[]>, Action<T[]> {
}
