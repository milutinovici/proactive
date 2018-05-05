import * as it from "tape";
import { fromEvent, BehaviorSubject } from "rxjs";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";

const ui = new ProactiveUI({ document });

it("value: Triggering a click should toggle a checkbox's checked state before the event handler fires", expect => {
    // This isn't strictly to do with the checked directive, but if this doesn't work, the rest of the specs aren't meaningful
    const template = `<input type="checkbox" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let clickHandlerFireCount = 0;
    let expectedCheckedStateInHandler: boolean;

    fromEvent(element, "click").subscribe (() => {
        clickHandlerFireCount++;
        expect.equal(element.checked, expectedCheckedStateInHandler);
    });
    expect.equal(element.checked, false);
    expectedCheckedStateInHandler = true;
    triggerEvent(element, "click");
    expect.equal(element.checked, true);
    expect.equal(clickHandlerFireCount, 1);

    expectedCheckedStateInHandler = false;
    triggerEvent(element, "click");
    expect.equal(element.checked, false);
    expect.equal(clickHandlerFireCount, 2);
    expect.end();
});

it("value: Should be able to control a checkbox's checked state", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(true);

    ui.domManager.applyDirectives({ someProp: myobservable }, element);
    expect.equal(element.checked, true);

    myobservable.next(false);
    expect.equal(element.checked, false);
    expect.end();
});

it("value: Should be able to control a radio's checked state", expect => {
    const template = `<input type="radio" x-value="someProp" value="my" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject("my");

    ui.domManager.applyDirectives({ someProp: myobservable }, element);
    expect.equal(element.checked, true);

    myobservable.next("other");
    expect.equal(element.checked, false);
    expect.end();
});

it("value: Should update observable properties on the model when the checkbox click event fires", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(false);
    ui.domManager.applyDirectives({ someProp: myobservable }, element);

    triggerEvent(element, "click");
    expect.equal(myobservable.getValue(), true);
    expect.end();
});

it("value: Should update observable properties on the model when the radio's click event fires", expect => {
    const template = `<input type="radio" x-value="someProp" value="my"/>`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject("other");
    ui.domManager.applyDirectives({ someProp: myobservable }, element);

    triggerEvent(element, "click");
    expect.equal(myobservable.getValue(), "my");
    expect.end();
});

it("value: Should only notify observable properties on the model once even if the checkbox change events fire multiple times", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(false);
    let timesNotified = 0;
    myobservable.subscribe(() => { timesNotified++; });
    timesNotified = 0; // ignore initial value notification
    ui.domManager.applyDirectives({ someProp: myobservable }, element);

    // Multiple events only cause one notification...
    triggerEvent(element, "click");
    triggerEvent(element, "change");
    triggerEvent(element, "change");
    expect.equal(timesNotified, 1);

    // ... until the checkbox value actually changes
    triggerEvent(element, "click");
    triggerEvent(element, "change");
    expect.equal(timesNotified, 2);
    expect.end();
});

it("value: Should only notify observable properties on the model once even if the radio change events fire multiple times", expect => {
    const template = `<input type="radio" x-value="someProp" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(false);
    let timesNotified = 0;
    myobservable.subscribe(() => { timesNotified++; });
    timesNotified = 0; // ignore initial value notification
    ui.domManager.applyDirectives({ someProp: myobservable }, element);

    // Multiple events only cause one notification...
    triggerEvent(element, "click");
    triggerEvent(element, "change");
    triggerEvent(element, "change");
    expect.equal(timesNotified, 1);

    // ... until the checkbox value actually changes
    myobservable.next(false);
    triggerEvent(element, "click");
    triggerEvent(element, "change");
    expect.equal(timesNotified, 2);
    expect.end();
});

it("value: should update non observable values", expect => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];
    const viewmodel = { someProp: false };
    ui.domManager.applyDirectives(viewmodel, el);

    triggerEvent(el, "click");
    expect.equal(viewmodel.someProp, true);

    expect.end();
});

it("value: multiple radios bound to a single value", expect => {
    const template = `<div>
                          <input type="radio" name="grp" x-value="someProp" value="1st" />
                          <input type="radio" name="grp" x-value="someProp" value="2nd" />
                      </div>`;
    const obs = new BehaviorSubject(false);
    const el = <HTMLElement> parse(template)[0];
    const viewmodel = { someProp: obs };
    ui.domManager.applyDirectives(viewmodel, el);

    triggerEvent(el.children[0], "click");
    expect.equal(viewmodel.someProp.getValue(), "1st");
    triggerEvent(el.children[1], "click");
    expect.equal(viewmodel.someProp.getValue(), "2nd");
    expect.end();
});
