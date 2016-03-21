import { Observable, BehaviorSubject, Symbol } from "rxjs/Rx";
import { ComputedObservable } from "./computed";
import { Func, Disposable, Computed } from "./interfaces";
import { ListChange, ItemChange } from "./list.change";

export class ComputedListObservable<T> extends ComputedObservable<T[]> {
    _changes: BehaviorSubject<ListChange<T>>;
    get changes() {
        return this._changes.asObservable();
    }
    constructor(source: Observable<T[]>, initial: T[] = []) {
        super(source, initial);
        this._changes = new BehaviorSubject(new ListChange(initial.map((x, i) => ItemChange.add(x, i))));
    }

    static createComputedList<T>(source: Observable<T[]>): ComputedList<T> {
        const accessor: any = function<T>() {
            return accessor.getValue();
        };
        const observable = new ComputedListObservable(source);
        for (const attrname in observable) {
            accessor[attrname] = observable[attrname];
        }
        accessor.subscription = accessor.subscribe((val: T) => accessor.value = val, (e: Error) => {});
        return accessor;
    }
    isEmpty(): boolean {
        return this.value.length === 0;
    }

    mapList<R>(fn: (x: T, ix?: number) => R): ComputedList<R> {
        const obs: any = this.map(x => x.map(fn));
        return obs.toComputedList();
    }
    filterList(fn: (x: T, ix?: number) => boolean): ComputedList<T> {
        const obs: any = this.map(x => x.filter(fn));
        return obs.toComputedList();
    }
    sortList(fn: (x: T, y: T) => number): ComputedList<T> {
        const obs: any = this.map(x => x.sort(fn));
        return obs.toComputedList();
    }
    everyList(fn: (x: T, ix?: number) => boolean): Computed<boolean> {
        return this.map(x => x.every(fn)).toComputed();
    }
    someList(fn: (x: T, ix?: number) => boolean): Computed<boolean> {
        return this.map(x => x.some(fn)).toComputed();
    }
    reduceList<R>(fn: (x: R, y: T) => R, initial: R): Computed<R> {
        return this.map(x => x.reduce(fn, initial)).toComputed();
    }

    filterInc(fn: (x: T, ix?: number) => boolean): ComputedList<T> {
        const obs: any = this.changes.scan((acc, change) => {
                const remove = change.deleted.filter(x => fn(x.value)).map(x => x.value);
                const add = change.added.filter(x => fn(x.value)).map(x => x.value);
                const diff = ComputedListObservable.diff<T>(acc, remove);
                return diff.concat(add);
            }, []);
        return obs.toComputedList();
    }
    mapInc<R>(fn: (x: T, ix?: number) => R): ComputedList<T> {
        const obs: any = this.changes.scan((acc, change) => {
                const old = acc.concat([]);
                change.deleted.forEach(x => old.splice(x.oldIndex, 1));
                const add = change.added.map(x => fn(x.value));
                return old.concat(add);
            }, []);
        return obs.toComputedList();
    }


    private static diff<T>(a: T[], b: T[]) {
        return a.filter((i) => b.indexOf(i) < 0);
    }
}

export interface ComputedList<T> extends ComputedListObservable<T>, Func<T[]>, Disposable {
}
