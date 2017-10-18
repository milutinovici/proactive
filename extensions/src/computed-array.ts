import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";

export class ComputedArray<T> extends Observable<T[]> {

    constructor(source: Observable<T[]>) {
        super();
        this.source = source;
    }

    public _map<R>(fn: (x: T, ix?: number) => R): ComputedArray<R> {
        const obs = this.pipe(map(array => array.map(fn)));
        return new ComputedArray(obs);
    }
    public _filter(fn: (x: T, ix?: number) => boolean): ComputedArray<T> {
        const obs = this.pipe(map(array => array.filter(fn)));
        return new ComputedArray(obs);
    }
    public _sort(fn: (x: T, y: T) => number): ComputedArray<T> {
        const obs = this.pipe(map(array => array.slice().sort(fn)));
        return new ComputedArray(obs);
    }
    public _every(fn: (x: T, ix?: number) => boolean): Observable<boolean> {
        return this.pipe(map(array => array.every(fn)));
    }
    public _some(fn: (x: T, ix?: number) => boolean): Observable<boolean> {
        return this.pipe(map(array => array.some(fn)));
    }
    public _reduce<R>(fn: (x: R, y: T) => R, initial: R): Observable<R> {
        return this.pipe(map(array => array.reduce(fn, initial)));
    }
    public _flatMap<R>(fn: (x: T) => R[]): ComputedArray<R> {
        const obs = this.pipe(map(array => array.reduce((cumulus: R[], next: T) => [...cumulus, ...fn(next)], <R[]> [])));
        return new ComputedArray(obs);
    }
    public static _whenAny<T>(observables: Observable<Observable<T>[]>): ComputedArray<T> {
        const obs = observables.pipe(mergeMap(array => Observable.combineLatest<T>(array)));
        return new ComputedArray(obs);
    }
}
