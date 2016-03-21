import { Observable, BehaviorSubject } from "rxjs/Rx";
import { ComputedListObservable } from "./computedList";
import { Computed, Func, Action } from "./interfaces";
import { ItemChange, ChangeStatus, ListChange } from "./list.change";

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
        this._changes.next(new ListChange(items.map((item, index) => ItemChange.add(item, old.length + index - 1))));

    }
    pop(): T {
        const old = this.getValue();
        const last = old[old.length - 1];
        this.setValue(old.slice(0, old.length - 1));
        this._changes.next(new ListChange([], [ItemChange.delete(last, old.length - 1)]));
        return last;
    }
    unshift(...items: T[]): void {
        if (items === null || items === undefined) {
            throw Error("items null/undefined");
        }
        const old = this.getValue();
        this.setValue(items.concat(old));
        const addedChanges = items.map((item, index) => ItemChange.add(item, index));
        const movedChanges = items.map((item, index) => ItemChange.move(item, index, index + items.length - 1));
        this._changes.next(new ListChange(addedChanges, [], movedChanges));
    }
    shift(): T {
        const old = this.getValue();
        const first = old[0];
        const retained = old.slice(1, old.length);
        this.setValue(retained);
        const movedChanges = retained.map((item, index) => ItemChange.move(item, index + 1, index));
        this._changes.next(new ListChange([], [ItemChange.delete(first, 0)], movedChanges));
        return first;
    }
    remove(fn: (element: T) => boolean): T[] {
        const old = this.getValue();
        const removed: T[] = [];
        const retained: T[] = [];
        const deletedChanges: ItemChange<T>[] = [];
        for (let i = 0; i < old.length; i++) {
            const value = old[i];
            if (fn(value)) {
                removed.push(value);
                deletedChanges.push(ItemChange.delete(value, i));
            } else {
                retained.push(value);
            }
        }
        this.setValue(retained);
        this._changes.next(new ListChange([], deletedChanges, [])); // TODO: move changes 
        return removed;
    }
    reverse(): void {
        const old = this.getValue();
        const reversed: T[] = [];
        const movedChanges: ItemChange<T>[] = [];
        for (let i = 0; i < old.length; i++) {
            const oldIndex = old.length - i - 1;
            reversed.push(old[oldIndex]);
            movedChanges.push(ItemChange.move(reversed[i], oldIndex, i));
        }
        this.setValue(reversed);
        this._changes.next(new ListChange([], [], movedChanges));
    }
    sort(fn: (a: T, b: T) => number): void {
        const old = this.getValue();
        const sorted: T[] = old.sort(fn);
        this.setValue(sorted);
        const movedChanges: ItemChange<T>[] = [];
        sorted.forEach((item, i) => {
            if (old[i] !== sorted[i]) {
                movedChanges.push(ItemChange.move(sorted[i], old.indexOf(sorted[i]), i));
            }
        });
        this._changes.next(new ListChange([], [], movedChanges));
    }
    splice(start: number, deleteCount: number): T[] {
        const old = this.getValue();
        const retained1 = old.slice(0, start);
        const retained2 = old.slice(start + deleteCount, old.length);
        const removed = old.slice(start, start + deleteCount);
        this.setValue(retained1.concat(retained2));
        const deletedChanges = removed.map((item, i) => ItemChange.delete(item, i));
        const movedChanges = retained2.map((item, i) => ItemChange.move(item, retained1.length + removed.length + i , retained1.length + i));
        this._changes.next(new ListChange([], deletedChanges, movedChanges));
        return removed;
    }
    clear(): T[] {
        const old = this.getValue();
        this.setValue(<T[]>[]);
        this._changes.next(new ListChange([], old.map((x, i) => ItemChange.delete(x, i))));
        return old;
    }
}
export interface List<T> extends ListObservable<T>, Func<T[]>, Action<T[]> {
}

