import { Observable, Subject, Symbol } from "rxjs/Rx";
import { ComputedObservable } from "./computed";
import { Func, Disposable, Computed } from "./interfaces";

export class ComputedListObservable<T> extends ComputedObservable<T[]> {

    constructor(source: Observable<T[]>, initial: T[]) {
        super(source, initial);
    }

    static createComputedList<T>(source: Observable<T[]>): ComputedList<T> {
        const accessor: any = function<T>() {
            return accessor.getValue();
        };
        const observable = new ComputedListObservable(source, undefined);
        for (const attrname in observable) {
            accessor[attrname] = observable[attrname];
        }
        accessor.subscription = accessor.subscribe((newValue: T) => {
            accessor.value = newValue;
        }, (e: any) => {});
        accessor[Symbol["observable"]] = () => accessor;
        return accessor;
    }
    isEmpty(): boolean {
        return this.value.length === 0;
    }

    mapList<R>(fn: (x: T, ix?: number) => R): ComputedList<R> {
        const obs = this.startWith(this.value).map(x => x.map(fn));
        return obs["toComputedList"]();
    }
    filterList(fn: (x: T, ix?: number) => boolean): ComputedList<T> {
        return this.startWith(this.value).map(x => x.filter(fn))["toComputedList"]();
    }
    sortList(fn: (x: T, y: T) => number): ComputedList<T> {
        return this.startWith(this.value).map(x => x.sort(fn))["toComputedList"]();
    }
    everyList(fn: (x: T, ix?: number) => boolean): Computed<boolean> {
        return this.startWith(this.value).map(x => x.every(fn)).toComputed();
    }
    someList(fn: (x: T, ix?: number) => boolean): Computed<boolean> {
        return this.startWith(this.value).map(x => x.some(fn)).toComputed();
    }
    reduceList<R>(fn: (x: R, y: T) => R, initial: R): Computed<R> {
        return this.startWith(this.value).map(x => x.reduce(fn, initial)).toComputed();
    }

}

export interface ComputedList<T> extends ComputedListObservable<T>, Func<T[]>, Disposable {
}
