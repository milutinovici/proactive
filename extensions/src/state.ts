import { Observable, Subscription } from "rxjs";

export class ObservableState<T> extends Observable<T> {
    public readonly subscription: Subscription;
    constructor(source: Observable<T>, protected value: T) {
        super();
        this.source = source;
        this.subscription = this.source.subscribe(x => this.value = x, console.error);
    }
    public getValue(): T {
        return this.value;
    }
    public toString(): string {
        return `${this.getValue()}`;
    }
}
