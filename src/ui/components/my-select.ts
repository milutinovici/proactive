import * as Rx from "rxjs";
import "text!./my-select.html";

export class Select {
    public readonly options: Rx.Observable<string[]>;
    public readonly selected: Rx.Observable<number>;
    constructor(options?: Rx.Observable<number[]>) {
        this.options = Rx.Observable.of([ "one", "two"]);
        this.selected = Rx.Observable.of(-1);
    }
}

export const template = require("text!./my-select.html");
export const viewModel = Select;
