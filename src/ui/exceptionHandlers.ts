import * as Rx from "rxjs";

export const exception: Rx.Observer<Error> = new Rx.Subscriber<Error>(e => {
        console.error(e);
    }, e => console.error(e));
