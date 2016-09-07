import { Observable, Subject, Symbol } from "rxjs/Rx";
import { ComputedValueImpl } from "./computed";
import { Func, Disposable, ComputedValue } from "./interfaces";

export class ComputedArrayImpl<T> extends ComputedValueImpl<T[]> {

    constructor(source: Observable<T[]>, initial?: T[]) {
        super(source, initial);
    }

    static createComputedArray<T>(source: Observable<T[]>): ComputedArray<T> {
        const accessor: any = function<T>() {
            return accessor.getValue();
        };
        const observable = new ComputedArrayImpl(source);
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

    mapArray<R>(fn: (x: T, ix?: number) => R): ComputedArray<R> {
        const obs: any = this.map(array => array.map(fn));
        return obs.toComputedArray();
    }
    filterArray(fn: (x: T, ix?: number) => boolean): ComputedArray<T> {
        const obs: any = this.map(array => array.filter(fn));
        return obs.toComputedArray();
    }
    sortArray(fn: (x: T, y: T) => number): ComputedArray<T> {
        const obs: any = this.map(array => array.slice().sort(fn));
        return obs.toComputedArray();
    }
    everyArray(fn: (x: T, ix?: number) => boolean): ComputedValue<boolean> {
        return this.map(array => array.every(fn)).toComputed();
    }
    someArray(fn: (x: T, ix?: number) => boolean): ComputedValue<boolean> {
        return this.map(array => array.some(fn)).toComputed();
    }
    reduceArray<R>(fn: (x: R, y: T) => R, initial: R): ComputedValue<R> {
        return this.map(array => array.reduce(fn, initial)).toComputed();
    }
    flatMapArray<R>(fn: (x: T) => R[]): ComputedArray<R> {
        const obs: any = this.map(array => array.reduce((cumulus: R[], next: T) => [...cumulus, ...fn(next)], <R[]> []));
        return obs.toComputedArray();
    }
    static whenAny<T>(observables: Observable<Observable<T>[]>): ComputedArray<T> {
        let obs: any = observables.mergeMap<T[]>(array => Observable.combineLatest<T[]>(array));
        return obs.toComputedArray();
    }
}

export interface ComputedArray<T> extends ComputedArrayImpl<T>, Func<T[]>, Disposable {
}
