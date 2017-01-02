import * as it from "tape";
import * as Rx from "rxjs";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/app";
import * as util from "../spec-utils";

it("checked: Triggering a click should toggle a checkbox's checked state before the event handler fires", expect => {
    // This isn't strictly to do with the checked binding, but if this doesn't work, the rest of the specs aren't meaningful
    const template = `<input type="checkbox" />`;
    const element = <HTMLInputElement> util.parse(template)[0];

    let clickHandlerFireCount = 0;
    let expectedCheckedStateInHandler: boolean;

    Rx.Observable.fromEvent(element, "click").subscribe (() => {
        clickHandlerFireCount++;
        expect.equal(element.checked, expectedCheckedStateInHandler);
    });
    expect.equal(element.checked, false);
    expectedCheckedStateInHandler = true;
    util.triggerEvent(element, "click");
    expect.equal(element.checked, true);
    expect.equal(clickHandlerFireCount, 1);

    expectedCheckedStateInHandler = false;
    util.triggerEvent(element, "click");
    expect.equal(element.checked, false);
    expect.equal(clickHandlerFireCount, 2);
    expect.end();
});

it("checked: Should be able to control a checkbox's checked state", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(true);

    ui.applyBindings({ someProp: myobservable }, element);
    expect.equal(element.checked, true);

    myobservable(false);
    expect.equal(element.checked, false);
    expect.end();
});

it("checked: Should be able to control a radio's checked state", expect => {
    const template = `<input type="radio" x-value="someProp" />`;
    const element = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(true);

    ui.applyBindings({ someProp: myobservable }, element);
    expect.equal(element.checked, true);

    myobservable(false);
    expect.equal(element.checked, false);
    expect.end();
});

it("checked: Should update observable properties on the model when the checkbox click event fires", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    ui.applyBindings({ someProp: myobservable }, element);

    util.triggerEvent(element, "click");
    expect.equal(myobservable(), true);
    expect.end();
});

it("checked: Should update observable properties on the model when the radio's click event fires", expect => {
    const template = `<input type="radio" x-value="someProp" />`;
    const element = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    ui.applyBindings({ someProp: myobservable }, element);

    util.triggerEvent(element, "click");
    expect.equal(myobservable(), true);
    expect.end();
});

it("checked: Should only notify observable properties on the model once even if the checkbox change events fire multiple times", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    let timesNotified = 0;
    myobservable.subscribe(() => { timesNotified++; });
    timesNotified = 0; // ignore initial value notification
    ui.applyBindings({ someProp: myobservable }, element);

    // Multiple events only cause one notification...
    util.triggerEvent(element, "click");
    util.triggerEvent(element, "change");
    util.triggerEvent(element, "change");
    expect.equal(timesNotified, 1);

    // ... until the checkbox value actually changes
    util.triggerEvent(element, "click");
    util.triggerEvent(element, "change");
    expect.equal(timesNotified, 2);
    expect.end();
});

it("checked: Should only notify observable properties on the model once even if the radio change events fire multiple times", expect => {
    const template = `<input type="radio" x-value="someProp" />`;
    const element = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(false);
    let timesNotified = 0;
    myobservable.subscribe(() => { timesNotified++; });
    timesNotified = 0; // ignore initial value notification
    ui.applyBindings({ someProp: myobservable }, element);

    // Multiple events only cause one notification...
    util.triggerEvent(element, "click");
    util.triggerEvent(element, "change");
    util.triggerEvent(element, "change");
    expect.equal(timesNotified, 1);

    // ... until the checkbox value actually changes
    myobservable(false);
    util.triggerEvent(element, "click");
    util.triggerEvent(element, "change");
    expect.equal(timesNotified, 2);
    expect.end();
});

it("checked: should update non observable values", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const el = <HTMLInputElement> util.parse(template)[0];
    const viewModel = { someProp: false };
    ui.applyBindings(viewModel, el);

    util.triggerEvent(el, "click");
    expect.equal(viewModel.someProp, true);

    expect.end();
});
