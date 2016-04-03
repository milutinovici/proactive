import "./observableExtensions";
import { Observable } from "rxjs";
import { Property, Computed } from "./interfaces";
import { PropertyObservable } from "./property";
import { ListObservable, List } from "./list";
import { ComputedListObservable, ComputedList } from "./computedList";

export function property<T>(initial: T = undefined): Property<T> {
    return PropertyObservable.createProperty(initial);
}
export function list<T>(initial: T[] = []): List<T> {
    return ListObservable.createList(initial);
}
export function whenAny<T>(observables: Observable<Observable<T>[]>): ComputedList<T> {
    return ComputedListObservable.whenAny(observables);
}
export { Computed, Property, List, ComputedList  }