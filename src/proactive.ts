import "./observableExtensions";
import { Observable } from "rxjs";
import { Property } from "./interfaces";
import { PropertyObservable } from "./property";
import { ListObservable, List } from "./list";
import { ComputedListObservable, ComputedList } from "./computedList";

export class px {
    static property<T>(initial: T = undefined): Property<T> {
        return PropertyObservable.createProperty(initial);
    }
    static list<T>(initial: T[] = []): List<T> {
        return ListObservable.createList(initial);
    }
    static whenAny<T>(observables: Observable<Observable<T>[]>): ComputedList<T> {
        return ComputedListObservable.whenAny(observables);
    }
}