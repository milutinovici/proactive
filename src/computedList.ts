import { Observable, Subject, Symbol } from "rxjs/Rx";
import { ComputedObservable } from "./computed";
import { Func, Disposable, Computed } from "./interfaces";

export class ComputedListObservable<T> extends ComputedObservable<T[]> {

    constructor(source: Observable<T[]>, initial?: T[]) {
        super(source, initial);
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
        accessor[Symbol.observable] = () => accessor;
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

}

export interface ComputedList<T> extends ComputedListObservable<T>, Func<T[]>, Disposable {
}
