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
        accessor.subscription = accessor.subscribe((val: T) => accessor.value = val, console.error);
        accessor[Symbol.observable] = () => accessor;
        return accessor;
    }
    isEmpty(): boolean {
        return this.value.length === 0;
    }

    mapList<R>(fn: (x: T, ix?: number) => R): ComputedList<R> {
        const obs: any = this.map(array => array.map(fn));
        return obs.toComputedList();
    }
    filterList(fn: (x: T, ix?: number) => boolean): ComputedList<T> {
        const obs: any = this.map(array => array.filter(fn));
        return obs.toComputedList();
    }
    sortList(fn: (x: T, y: T) => number): ComputedList<T> {
        const obs: any = this.map(array => array.slice().sort(fn));
        return obs.toComputedList();
    }
    everyList(fn: (x: T, ix?: number) => boolean): Computed<boolean> {
        return this.map(array => array.every(fn)).toComputed();
    }
    someList(fn: (x: T, ix?: number) => boolean): Computed<boolean> {
        return this.map(array => array.some(fn)).toComputed();
    }
    reduceList<R>(fn: (x: R, y: T) => R, initial: R): Computed<R> {
        return this.map(array => array.reduce(fn, initial)).toComputed();
    }
    flatMapList<R>(fn: (x: T) => R[]): ComputedList<R> {
        const obs: any = this.map(array => array.reduce((cumulus: R[], next: T) => [...cumulus, ...fn(next)], <R[]> []));
        return obs.toComputedList();
    }
    static whenAny<T>(observables: Observable<Observable<T>[]>): ComputedList<T> {
        let obs: any = observables.mergeMap<T[]>(array => Observable.combineLatest<T[]>(array));
        return obs.toComputedList();
    }
}

export interface ComputedList<T> extends ComputedListObservable<T>, Func<T[]>, Disposable {
}
