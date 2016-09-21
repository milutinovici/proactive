import * as Rx from "rxjs";
import { DomManager } from "../domManager";
import { BindingBase } from "./bindingBase";
import { IDataContext, INodeState } from "../interfaces";
import { isRxObserver } from "../utils";

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

export default class KeyPressBinding extends BindingBase<KeyboardEvent> {

    public priority = 0;

    constructor(domManager: DomManager) {
        super(domManager);
    }

    protected applyBindingInternal(el: HTMLElement, observer: Rx.Observer<KeyboardEvent>, ctx: IDataContext, state: INodeState<KeyboardEvent>, parameter: string) {

        let obs = Rx.Observable.fromEvent<KeyboardEvent>(el, "keydown")
            .filter((x: KeyboardEvent) => !x.repeat)
            .publish()
            .refCount();

        let combination: KeyCombination;
        let combinations: KeyCombination[] = [];

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

        this.wireKey(observer, obs, combinations, ctx, state.cleanup);
    }

    private testCombination(combination: KeyCombination, event: KeyboardEvent): boolean {
        let metaPressed = !!(event.metaKey && !event.ctrlKey);
        let altPressed = !!event.altKey;
        let ctrlPressed = !!event.ctrlKey;
        let shiftPressed = !!event.shiftKey;
        let keyCode = event.keyCode;

        let metaRequired = !!combination.keys["meta"];
        let altRequired = !!combination.keys["alt"];
        let ctrlRequired = !!combination.keys["ctrl"];
        let shiftRequired = !!combination.keys["shift"];

        // normalize keycodes
        if ((!shiftPressed || shiftRequired) && keyCode >= 65 && keyCode <= 90) {
            keyCode = keyCode + 32;
        }
        let mainKeyPressed = combination.keys[keysByCode[keyCode]] ||
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
        for (let i = 0; i < combinations.length; i++) {
            if (this.testCombination(combinations[i], event)) {
                return true;
            }
        }
        return false;
    }

    private wireKey(observer: Rx.Observer<KeyboardEvent>, obs: Rx.Observable<KeyboardEvent>, combinations: KeyCombination[], ctx: IDataContext, cleanup: Rx.Subscription) {
            if (isRxObserver(observer)) {
                cleanup.add(obs.filter(e => this.testCombinations(combinations, e)).subscribe(e => {
                    observer.next(e);
                    e.preventDefault();
                }));
            } else {
            throw Error("invalid binding options");
        }
    }
}

interface KeyCombination {
    expression: string;
    keys: { [name: string]: boolean };
}
