import { Observer, Subscription, fromEvent } from "rxjs";
import { filter, share } from "rxjs/operators";
import { DataFlow, Parametricity } from "../interfaces";
import { DirectiveHandler } from "./directiveHandler";

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
    46: "delete",
};

export class KeyPressDirective extends DirectiveHandler<KeyboardEvent> {
    constructor() {
        super();
        this.dataFlow = DataFlow.In;
        this.parametricity = Parametricity.Required;
    }

    public apply(element: Element, observer: Observer<KeyboardEvent>, parameters: string[]): Subscription {
            const obs = fromEvent<KeyboardEvent>(element, "keydown").pipe(
                filter((x: KeyboardEvent) => !x.repeat), share());

            const combinations = this.getKeyCombination(parameters.join("-"));

            return obs.pipe(filter(e => this.testCombinations(combinations, e))).subscribe(e => {
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
