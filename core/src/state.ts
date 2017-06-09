import { Observable, Subscription } from "rxjs";

export class ObservableStateImpl<T> extends Observable<T> {
    private subscription: Subscription;
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
