import { Observable, BehaviorSubject } from "rxjs/Rx";
import { ComputedListObservable } from "./computedList";
import { Computed, Func, Action } from "./interfaces";

export class ListObservable<T> extends ComputedListObservable<T> {
    protected source: BehaviorSubject<T[]>;
    constructor(initial: T[] = []) {
        super(new BehaviorSubject<T[]>(initial), initial);
    }
    protected setValue(value: T[]) {
        this.value = value;
        this.source.next(value);
    }
    static createList<T>(initial: T[]): List<T> {
        const accessor: any = function<T>(value: T[]) {
            if (arguments.length > 0) {
                accessor.setValue(value);
            } else {
                return accessor.getValue();
            }
        };
        const observable = new ListObservable(initial);
        for (const attrname in observable) {
            accessor[attrname] = observable[attrname];
        }
        return accessor;
    }
    push(...items: T[]): void {
        if (items === null || items === undefined) {
            throw Error("items null/undefined");
        }
        const old = this.getValue();
        this.setValue(old.concat(items));
    }
    pop(): T {
        const old = this.getValue();
        const last = old[old.length - 1];
        this.setValue(old.slice(0, old.length - 1));
        return last;
    }
    unshift(...items: T[]): void {
        if (items === null || items === undefined) {
            throw Error("items null/undefined");
        }
        const old = this.getValue();
        this.setValue(items.concat(old));
    }
    shift(): T {
        const old = this.getValue();
        const first = old[0];
        const retained = old.slice(1, old.length);
        this.setValue(retained);
        return first;
    }
    remove(fn: (element: T) => boolean): T[] {
        const old = this.getValue();
        const removed: T[] = [];
        const retained: T[] = [];
        for (let i = 0; i < old.length; i++) {
            const value = old[i];
            if (fn(value)) {
                removed.push(value);
            } else {
                retained.push(value);
            }
        }
        this.setValue(retained);
        return removed;
    }
    reverse(): void {
        const old = this.getValue();
        const reversed = old.reverse();
        this.setValue(reversed);
    }
    sort(fn: (a: T, b: T) => number): void {
        const old = this.getValue();
        const sorted: T[] = old.sort(fn);
        this.setValue(sorted);
    }
    splice(start: number, deleteCount: number): T[] {
        const old = this.getValue();
        const retained1 = old.slice(0, start);
        const retained2 = old.slice(start + deleteCount, old.length);
        const removed = old.slice(start, start + deleteCount);
        this.setValue(retained1.concat(retained2));
        return removed;
    }
    clear(): T[] {
        return this.remove(x => true);
    }
}
export interface List<T> extends ListObservable<T>, Func<T[]>, Action<T[]> {
}

