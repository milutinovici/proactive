import it from "ava";
import { fromEvent, BehaviorSubject } from "rxjs";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";

const ui = new ProactiveUI({ document });

it("value: Triggering a click should toggle a checkbox's checked state before the event handler fires", async t => {
    // This isn't strictly to do with the checked directive, but if this doesn't work, the rest of the specs aren't meaningful
    const template = `<input type="checkbox" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let clickHandlerFireCount = 0;
    let tedCheckedStateInHandler: boolean;

    fromEvent(element, "click").subscribe (() => {
        clickHandlerFireCount++;
        t.is(element.checked, tedCheckedStateInHandler);
    });
    t.is(element.checked, false);
    tedCheckedStateInHandler = true;
    triggerEvent(element, "click");
    t.is(element.checked, true);
    t.is(clickHandlerFireCount, 1);

    tedCheckedStateInHandler = false;
    triggerEvent(element, "click");
    t.is(element.checked, false);
    t.is(clickHandlerFireCount, 2);
    
});

it("value: Should be able to control a checkbox's checked state", async t => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(true);

    ui.domManager.applyDirectives({ someProp: myobservable }, element);
    t.is(element.checked, true);

    myobservable.next(false);
    t.is(element.checked, false);
    
});

it("value: Should be able to control a radio's checked state", async t => {
    const template = `<input type="radio" x-value="someProp" value="my" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject("my");

    ui.domManager.applyDirectives({ someProp: myobservable }, element);
    t.is(element.checked, true);

    myobservable.next("other");
    t.is(element.checked, false);
    
});

it("value: Should update observable properties on the model when the checkbox click event fires", async t => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(false);
    ui.domManager.applyDirectives({ someProp: myobservable }, element);

    triggerEvent(element, "click");
    t.is(myobservable.getValue(), true);
    
});

it("value: Should update observable properties on the model when the radio's click event fires", async t => {
    const template = `<input type="radio" x-value="someProp" value="my"/>`;
    const element = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject("other");
    ui.domManager.applyDirectives({ someProp: myobservable }, element);

    triggerEvent(element, "click");
    t.is(myobservable.getValue(), "my");
    
});

it("value: Should only notify observable properties on the model once even if the checkbox change events fire multiple times", async t => {
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
    t.is(timesNotified, 1);

    // ... until the checkbox value actually changes
    triggerEvent(element, "click");
    triggerEvent(element, "change");
    t.is(timesNotified, 2);
    
});

it("value: Should only notify observable properties on the model once even if the radio change events fire multiple times", async t => {
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
    t.is(timesNotified, 1);

    // ... until the checkbox value actually changes
    myobservable.next(false);
    triggerEvent(element, "click");
    triggerEvent(element, "change");
    t.is(timesNotified, 2);
    
});

it("value: checkbox should update non observable values", async t => {
    const template = `<input type="checkbox" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];
    const viewmodel = { someProp: false };
    ui.domManager.applyDirectives(viewmodel, el);

    triggerEvent(el, "click");
    t.is(viewmodel.someProp, true);

    
});

it("value: multiple radios bound to a single value", async t => {
    const template = `<div>
                          <input type="radio" name="grp" x-value="someProp" value="1st" />
                          <input type="radio" name="grp" x-value="someProp" value="2nd" />
                      </div>`;
    const obs = new BehaviorSubject("");
    const el = <HTMLElement> parse(template)[0];
    const viewmodel = { someProp: obs };
    ui.domManager.applyDirectives(viewmodel, el);

    triggerEvent(el.children[0], "click");
    t.is(viewmodel.someProp.getValue(), "1st");
    triggerEvent(el.children[1], "click");
    t.is(viewmodel.someProp.getValue(), "2nd");
    
});
