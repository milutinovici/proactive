import { Observable, Observer, Subscription } from "rxjs";
import { DataFlow, Parametricity } from "../interfaces";
import { DomManager } from "../domManager";
import { SimpleBinding } from "./bindingBase";
import { isRxObserver } from "../utils";
import { exception } from "../exceptionHandlers";

const keysByCode = {
    8: "backspace",
    9: "tab",
    13: "enter",
    27: "esc",
    32: "space",
    33: "pageup",
    34: "pagedown",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    45: "insert",
    46: "deconste",
};

export class KeyPressBinding extends SimpleBinding<KeyboardEvent> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.dataFlow = DataFlow.In;
        this.parametricity = Parametricity.Required;
    }

    public apply(el: Element, observer: Observer<KeyboardEvent>, parameter: string): Subscription {
            if (parameter === undefined) {
                exception.next(new Error(`key must be defined for ${this.name} binding on ${el.tagName}`));
                return Subscription.EMPTY;
            }
            if (!isRxObserver(observer)) {
                exception.next(new Error(`must supply function or observer for ${this.name} binding on ${el.tagName}`));
                return Subscription.EMPTY;
            }

            const obs = Observable.fromEvent<KeyboardEvent>(el, "keydown")
                .filter((x: KeyboardEvent) => !x.repeat)
                .publish()
                .refCount();

            const combinations = this.getKeyCombination(parameter);

            return obs.filter(e => this.testCombinations(combinations, e)).subscribe(e => {
                observer.next(e);
                e.preventDefault();
            });
    }

    private getKeyCombination(parameter: string): KeyCombination[] {
        let combination: KeyCombination;
        const combinations: KeyCombination[] = [];

        // parse key combinations
        parameter.split(" ").forEach(variation => {
            combination = {
                expression: parameter,
                keys: {},
            };

            variation.split("-").forEach(value => {
                combination.keys[value.trim()] = true;
            });

            combinations.push(combination);
        });
        return combinations;
    }

    private testCombination(combination: KeyCombination, event: KeyboardEvent): boolean {
        const metaPressed = !!(event.metaKey && !event.ctrlKey);
        const altPressed = !!event.altKey;
        const ctrlPressed = !!event.ctrlKey;
        const shiftPressed = !!event.shiftKey;
        let keyCode = event.keyCode;

        const metaRequired = !!combination.keys["meta"];
        const altRequired = !!combination.keys["alt"];
        const ctrlRequired = !!combination.keys["ctrl"];
        const shiftRequired = !!combination.keys["shift"];

        // normalize keycodes
        if ((!shiftPressed || shiftRequired) && keyCode >= 65 && keyCode <= 90) {
            keyCode = keyCode + 32;
        }
        const mainKeyPressed = combination.keys[keysByCode[keyCode]] ||
                             combination.keys[keyCode.toString()] ||
                             combination.keys[String.fromCharCode(keyCode)];

        return (
            mainKeyPressed &&
            (metaRequired === metaPressed) &&
            (altRequired === altPressed) &&
            (ctrlRequired === ctrlPressed) &&
            (shiftRequired === shiftPressed)
        );
    }

    private testCombinations(combinations: KeyCombination[], event: KeyboardEvent): boolean {
        return combinations.some(combi => this.testCombination(combi, event));
    }

}

interface KeyCombination {
    expression: string;
    keys: { [name: string]: boolean };
}
