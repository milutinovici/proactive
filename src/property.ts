import { BehaviorSubject, Symbol, Observer } from "rxjs/Rx";
import { Property } from "./interfaces";
import { ComputedObservable } from "./computed";

export class PropertyObservable<T> extends ComputedObservable<T> implements Observer<T> {
    protected source: BehaviorSubject<T>;

    constructor(initial: T) {
        super(new BehaviorSubject<T>(initial), initial);
    }
    
    protected setValue(value: T) {
        this.value = value;
        this.source.next(value);
    }
    public next(value: T) {
        this.source.next(value)
    }
    public error(err?: any) {
        this.source.error(err);
    }
    public complete() {
        this.source.complete();
    }
    
    static createProperty<T>(initial: T): Property<T> {
        const accessor: any = function<T>(value: T) {
            if (arguments.length > 0) {
                accessor.setValue(value);
            } else {
                return accessor.getValue();
            }
        };
        const observable = new PropertyObservable(initial);
        for (const attrname in observable) {
            accessor[attrname] = observable[attrname];
        }
        accessor[Symbol.observable] = () => accessor;
        accessor[Symbol.rxSubscriber] = () => accessor;
        return accessor;
    }
}
