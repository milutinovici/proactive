import "./observableExtensions";
import { Property } from "./interfaces";
import { PropertyObservable } from "./property";
import { ListObservable, List } from "./list";

export class px {
    static property<T>(initial: T = undefined): Property<T> {
        return PropertyObservable.createProperty(initial);
    }
    static list<T>(initial: T[] = []): List<T> {
        return ListObservable.createList(initial);
    }
}