import * as Rx from "rxjs";
import { ObservableValue } from "./interfaces";
import { ComputedValueImpl } from "./computed";

export class ObservableValueImpl<T> extends ComputedValueImpl<T> implements Rx.Observer<T> {
    protected source: Rx.BehaviorSubject<T>;

    constructor(initial: T) {
        super(new Rx.BehaviorSubject<T>(initial), initial);
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
        accessor[Rx.Symbol.observable] = () => accessor;
        accessor[Rx.Symbol.rxSubscriber] = () => accessor;
        return accessor;
    }
}
