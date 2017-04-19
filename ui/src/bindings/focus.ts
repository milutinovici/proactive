import { Observable, Observer, Subject, Subscription } from "rxjs";
import { DomManager } from "../domManager";
import { SimpleHandler } from "./baseHandler";
import { DataFlow } from "../interfaces";
import { isRxObserver } from "../utils";

export class FocusBinding extends SimpleHandler<boolean> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.unique = true;
        this.dataFlow = DataFlow.Out | DataFlow.In;
        this.priority = -1;
    }

    public apply(el: HTMLInputElement, observable: Observable<boolean> | Subject<boolean>, parameter?: string): Subscription {
        const delay = parseInt(parameter || "0");

        const subscription = observable.subscribe(x => {
            this.updateElement(el, x, delay);
        });

        if (isRxObserver(observable)) {
            subscription.add(this.getFocusEventObservables(el).subscribe(hasFocus => {
                this.handleElementFocusChange(el, observable, hasFocus);
            }));
        }
        return subscription;
    }

    private updateElement(el: HTMLElement, value: boolean, delay: number) {
        if (value) {
            // Note: If the element is currently hidden, we schedule the focus change
            // to occur "soonish". Technically this is a hack because it hides the fact
            // that we make tricky assumption about the presence of a "visible" binding
            // on the same element who's subscribe handler runs after us

            if (delay === 0 && el.style.display !== "none") {
                el.focus();
            } else {
                Observable.timer(delay).subscribe(() => {
                    el.focus();
                });
            }
        } else {
            el.blur();
        }
    }

    private handleElementFocusChange(el: HTMLElement, observer: Observer<boolean>, isFocused: boolean) {
        // If possible, ignore which event was raised and determine focus state using activeElement,
        // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
        const ownerDoc = el.ownerDocument;

        if ("activeElement" in ownerDoc) {
            let active: Element;
            try {
                active = ownerDoc.activeElement;
            } catch (e) {
                // IE9 throws if you access activeElement during page load (see issue #703)
                active = ownerDoc.body;
            }
            isFocused = (active === el);
        }

        observer.next(isFocused);
    }

    private getFocusEventObservables(el: HTMLInputElement): Observable<boolean> {
        return Observable.merge(Observable.fromEvent<Event>(el, "focus").mapTo(true),
                                   Observable.fromEvent<Event>(el, "focusin").mapTo(true),
                                   Observable.fromEvent<Event>(el, "blur").mapTo(false),
                                   Observable.fromEvent<Event>(el, "focusout").mapTo(false));

    }
}
