import { Subject } from "rxjs/Rx";
import { Property } from "./interfaces";
import { ComputedObservable } from "./computed";

export class PropertyObservable<T> extends ComputedObservable<T> {
    protected source: Subject<T>;

    constructor(initial: T) {
        super(new Subject<T>(), initial);
        this.source.next(initial);
    }
    protected setValue(value: T) {
        this.value = value;
        this.source.next(value);
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
        return accessor;
    }
}
