import * as Rx from "rxjs";
import { ObservableValue } from "./interfaces";
import { ComputedValueImpl } from "./computed";

export class ObservableValueImpl<T> extends ComputedValueImpl<T> implements Rx.Observer<T> {
    protected readonly source: Rx.BehaviorSubject<T>;

    constructor(initial: T) {
        super(new Rx.BehaviorSubject<T>(initial), initial);
    }

    public setValue(value: T) {
        this.value = value;
        this.source.next(value);
    }
    public next(value: T) {
        this.value = value;
        this.source.next(value);
    }
    public error(err: Error) {
        this.source.error(err);
    }
    public complete() {
        this.source.complete();
    }
    public [Rx.Symbol.rxSubscriber]() {
        return this;
    }

    public static createValue<T>(initial?: T): ObservableValue<T> {
        const accessor: ObservableValueImpl<T> = function(value: T) {
            if (arguments.length > 0) {
                return accessor.setValue(value);
            } else {
                return accessor.getValue();
            }
        } as any;
        const call = accessor["call"];
        const apply = accessor["apply"];
        Object["setPrototypeOf"](accessor, new ObservableValueImpl(initial));
        accessor["call"] = call;
        accessor["apply"] = apply;
        return accessor as any;
    }
}
