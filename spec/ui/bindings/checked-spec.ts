import * as it from "tape";
import * as Rx from "rxjs";
import * as px from "../../../src/core/proactive";
import { app } from "../../../src/ui/app";
import * as util from "../spec-utils";

it("checked: Triggering a click should toggle a checkbox's checked state before the event handler fires", expect => {
    // This isn't strictly to do with the checked binding, but if this doesn't work, the rest of the specs aren't meaningful
    const template = `<input type="checkbox" />`;
    const testNode = <HTMLInputElement> util.parse(template)[0];

    let clickHandlerFireCount = 0;
    let expectedCheckedStateInHandler: boolean;

    Rx.Observable.fromEvent(testNode, "click").subscribe (() => {
        clickHandlerFireCount++;
        expect.equal(testNode.checked, expectedCheckedStateInHandler);
    });
    expect.equal(testNode.checked, false);
    expectedCheckedStateInHandler = true;
    util.triggerEvent(testNode, "click");
    expect.equal(testNode.checked, true);
    expect.equal(clickHandlerFireCount, 1);

    expectedCheckedStateInHandler = false;
    util.triggerEvent(testNode, "click");
    expect.equal(testNode.checked, false);
    expect.equal(clickHandlerFireCount, 2);
    expect.end();
});

it("checked: Should be able to control a checkbox's checked state", expect => {
    const template = `<input type="checkbox" bind-checked="someProp" />`;
    const testNode = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(true);

    app.applyBindings({ someProp: myobservable }, testNode);
    expect.equal(testNode.checked, true);

    myobservable(false);
    expect.equal(testNode.checked, false);
    expect.end();
});

it("checked: Should be able to control a radio's checked state", expect => {
    const template = `<input type="radio" bind-checked="someProp" />`;
    const testNode = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(true);

    app.applyBindings({ someProp: myobservable }, testNode);
    expect.equal(testNode.checked, true);

    myobservable(false);
    expect.equal(testNode.checked, false);
    expect.end();
});

it("checked: Should update observable properties on the model when the checkbox click event fires", expect => {
    const template = `<input type="checkbox" bind-checked="someProp" />`;
    const testNode = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    app.applyBindings({ someProp: myobservable }, testNode);

    util.triggerEvent(testNode, "click");
    expect.equal(myobservable(), true);
    expect.end();
});

it("checked: Should update observable properties on the model when the radio's click event fires", expect => {
    const template = `<input type="radio" bind-checked="someProp" />`;
    const testNode = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    app.applyBindings({ someProp: myobservable }, testNode);

    util.triggerEvent(testNode, "click");
    expect.equal(myobservable(), true);
    expect.end();
});

it("checked: Should only notify observable properties on the model once even if the checkbox change events fire multiple times", expect => {
    const template = `<input type="checkbox" bind-checked="someProp" />`;
    const testNode = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    let timesNotified = 0;
    myobservable.subscribe(() => { timesNotified++; });
    timesNotified = 0; // ignore initial value notification
    app.applyBindings({ someProp: myobservable }, testNode);

    // Multiple events only cause one notification...
    util.triggerEvent(testNode, "click");
    util.triggerEvent(testNode, "change");
    util.triggerEvent(testNode, "change");
    expect.equal(timesNotified, 1);

    // ... until the checkbox value actually changes
    util.triggerEvent(testNode, "click");
    util.triggerEvent(testNode, "change");
    expect.equal(timesNotified, 2);
    expect.end();
});

it("checked: Should only notify observable properties on the model once even if the radio change events fire multiple times", expect => {
    const template = `<input type="radio" bind-checked="someProp" />`;
    const testNode = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    let timesNotified = 0;
    myobservable.subscribe(() => { timesNotified++; });
    timesNotified = 0; // ignore initial value notification
    app.applyBindings({ someProp: myobservable }, testNode);

    // Multiple events only cause one notification...
    util.triggerEvent(testNode, "click");
    util.triggerEvent(testNode, "change");
    util.triggerEvent(testNode, "change");
    expect.equal(timesNotified, 1);

    // ... until the checkbox value actually changes
    myobservable(false);
    util.triggerEvent(testNode, "click");
    util.triggerEvent(testNode, "change");
    expect.equal(timesNotified, 2);
    expect.end();
});
