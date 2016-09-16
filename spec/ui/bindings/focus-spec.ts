import * as it from "tape";
import * as px from "../../../src/core/proactive";
import { app } from "../../../src/ui/app";
import * as util from "../spec-utils";

let focusInEvent = "focusin";
let focusOutEvent = "focusout";

it("focus: Should respond to changes on an observable value by blurring or focusing the element", expect => {
    const template = `<div><input bind-focus="myVal" /><input /></div>`;
    const el = util.parse(template)[0];
    let input = <HTMLInputElement> el.childNodes[0];
    document.body.appendChild(el);

    let currentState = false;
    let model = { myVal: px.value() };

    app.applyBindings(model, el);

    input.addEventListener(focusInEvent, () => {
        currentState = true;
    });
    input.addEventListener(focusOutEvent, () => {
        currentState = false;
    });

    // When the value becomes true, we focus
    model.myVal(true);
    expect.equal(currentState, true);

    // When the value becomes false, we blur
    model.myVal(false);
    expect.equal(currentState, false);
    expect.end();
    document.body.removeChild(el);
});

it("focus: Should set an observable value to be true on focus and false on blur", expect => {
    const template = `<div><input bind-focus="myVal" /><input /><p bind-text="myVal"></p></div>`;
    const el = util.parse(template)[0];
    document.body.appendChild(el);
    let model = { myVal: px.value() };

    app.applyBindings(model, el);

    // Need to raise focusInEvent and focusOutEvent manually, because simply calling ".focus()" and ".blur()"
    // in IE doesn't reliably trigger the "focus" and "blur" events synchronously
    let input1 = <HTMLInputElement> el.childNodes[0];
    let input2 = <HTMLInputElement> el.childNodes[0];

    input1.focus();
    util.triggerEvent(input1, focusInEvent);
    expect.equal(model.myVal(), true);

    // Move the focus elsewhere
    input2.focus();
    util.triggerEvent(input1, focusOutEvent);
    expect.equal(model.myVal(), false);

    // If the model value becomes true after a blur, we re-focus the element
    // (Represents issue #672, where this wasn't working)
    let didFocusExpectedElement = false;
    input1.addEventListener(focusInEvent, () => { didFocusExpectedElement = true; });
    model.myVal(true);
    expect.equal(didFocusExpectedElement, true);
    expect.end();
});

it("focus: Should not unnecessarily focus or blur an element that is already focused/blurred", expect => {
    const template = `<input bind-focus="isFocused" />`;
    const el = <HTMLInputElement> util.parse(template)[0];
    // This is the closest we can get to representing issue #698 as a spec
    let model = { isFocused: px.value<Object | null>({}) };

    app.applyBindings(model, el);

    // The elem is already focused, so changing the model value to a different truthy value
    // shouldn't cause any additional focus events
    let didFocusAgain = false;
    el.addEventListener(focusInEvent, () => { didFocusAgain = true; });
    model.isFocused(1);
    expect.equal(didFocusAgain, false);

    // Similarly, when the elem is already blurred, changing the model value to a different
    // falsey value shouldn't cause any additional blur events
    model.isFocused(false);
    let didBlurAgain = false;
    el.addEventListener(focusOutEvent, () => { didBlurAgain = true; });
    model.isFocused(null);
    expect.equal(didBlurAgain, false);
    expect.end();
});
