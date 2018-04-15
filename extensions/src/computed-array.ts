import { Observable, combineLatest } from "rxjs";
import { map, mergeMap } from "rxjs/operators";

export class ComputedArray<T> extends Observable<T[]> {

    constructor(source: Observable<T[]>) {
        super();
        this.source = source;
    }

    public map<R>(fn: (x: T, ix?: number) => R): ComputedArray<R> {
        const obs = this.pipe(map(array => array.map(fn)));
        return new ComputedArray(obs);
    }
    public filter(fn: (x: T, ix?: number) => boolean): ComputedArray<T> {
        const obs = this.pipe(map(array => array.filter(fn)));
        return new ComputedArray(obs);
    }
    public sorted(fn: (x: T, y: T) => number): ComputedArray<T> {
        const obs = this.pipe(map(array => array.slice().sort(fn)));
        return new ComputedArray(obs);
    }
    public every(fn: (x: T, ix?: number) => boolean): Observable<boolean> {
        return this.pipe(map(array => array.every(fn)));
    }
    public some(fn: (x: T, ix?: number) => boolean): Observable<boolean> {
        return this.pipe(map(array => array.some(fn)));
    }
    public reduce<R>(fn: (x: R, y: T) => R, initial: R): Observable<R> {
        return this.pipe(map(array => array.reduce(fn, initial)));
    }
    public flatMap<R>(fn: (x: T) => R[]): ComputedArray<R> {
        const obs = this.pipe(map(array => array.reduce((cumulus: R[], next: T) => [...cumulus, ...fn(next)], <R[]> [])));
        return new ComputedArray(obs);
    }
    public static _whenAny<T>(observables: Observable<Observable<T>[]>): ComputedArray<T> {
        const obs = observables.pipe(mergeMap(array => combineLatest(array)));
        return new ComputedArray(obs);
    }
}
