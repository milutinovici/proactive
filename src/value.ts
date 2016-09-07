import { BehaviorSubject, Symbol, Observer } from "rxjs/Rx";
import { ObservableValue } from "./interfaces";
import { ComputedValueImpl } from "./computed";

export class ObservableValueImpl<T> extends ComputedValueImpl<T> implements Observer<T> {
    protected source: BehaviorSubject<T>;

    constructor(initial: T) {
        super(new BehaviorSubject<T>(initial), initial);
    }

    public setValue(value: T) {
        this.value = value;
        this.source.next(value);
    }
    public next(value: T) {
        this.source.next(value);
    }
    public error(err?: any) {
        this.source.error(err);
    }
    public complete() {
        this.source.complete();
    }

    public static createValue<T>(initial: T): ObservableValue<T> {
        const accessor: any = function<T>(value: T) {
            if (arguments.length > 0) {
                accessor.setValue(value);
            } else {
                return accessor.getValue();
            }
        };
        const observable = new ObservableValueImpl(initial);
        for (const attrname in observable) {
            accessor[attrname] = observable[attrname];
        }
        accessor[Symbol.observable] = () => accessor;
        accessor[Symbol.rxSubscriber] = () => accessor;
        return accessor;
    }
}
