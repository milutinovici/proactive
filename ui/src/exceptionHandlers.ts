import { Observer, Subscriber } from "rxjs";

export const exception: Observer<Error> = new Subscriber<Error>(e => {
        console.error(e.message);
    }, (e: Error) => console.error(e.message));
