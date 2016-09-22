import * as it from "tape";
import * as Rx from "rxjs";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/ui";
import * as util from "../spec-utils";

it("value: Should treat null values as empty strings", expect => {
    const template = `<input type="text" bind-value="myProp" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    ui.applyBindings({ myProp: px.value(0) }, el);
    expect.equal(el.value, "0");
    expect.end();
});

it("value: Should assign an empty string as value if the model value is undefined", expect => {
    const template = `<input type="text" bind-value="undefined" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    ui.applyBindings(null, el);
    expect.equal(el.value, "");
    expect.end();
});

it("value: For observable values, should unwrap the value and update on change", expect => {
    const template = `<input type="text" bind-value="someProp" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(123);
    ui.applyBindings({ someProp: myobservable }, el);
    expect.equal(el.value, "123");
    myobservable(456);
    expect.equal(el.value, "456");
    expect.end();
});

it("value: For observable values, should update on change if new value is 'strictly' different from previous value", expect => {
    const template = `<input type="text" bind-value="someProp" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value<string | number>("+123");
    ui.applyBindings({ someProp: myobservable }, el);
    expect.equal(el.value, "+123");
    myobservable(123);
    expect.equal(el.value, "123");
    expect.end();
});

it("value: For writeable observable values, should catch the node's onchange and write values back to the observable", expect => {
    const template = `<input type="text" bind-value="someProp" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let myobservable = px.value(123);
    ui.applyBindings({ someProp: myobservable }, el);
    el.value = "some user-entered value";
    util.triggerEvent(el, "change");

    myobservable.subscribe(x => {
        expect.equal(x, "some user-entered value");
        expect.end();
    });

});

it("value: Should ignore node changes when bound to a read-only observable", expect => {
    const template = `<input type="text" bind-value="prop" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let computedValue = Rx.Observable.of("zzz").toComputed();
    let vm = { prop: computedValue };

    ui.applyBindings(vm, el);
    expect.equal(el.value, "zzz");

    // Change the input value and trigger change event; verify that the view model wasn't changed
    el.value = "yyy";
    util.triggerEvent(el, "change");
    expect.equal(vm.prop, computedValue);
    expect.equal(computedValue(), "zzz");
    expect.end();
});

it("value: Should be able to write to observable subproperties of an observable, even after the parent observable has changed", expect => {
    // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
    // Set up a text box whose value is linked to the subproperty of the observable's current value
    const template = `<input type="text" bind-value="myprop.subproperty" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let originalSubproperty = px.value("original value");
    let newSubproperty = px.value<string>();
    let model = { myprop: px.value<any>({ subproperty: originalSubproperty }) };

    ui.applyBindings(model, el);
    expect.equal(el.value, "original value");

    model.myprop({ subproperty: newSubproperty }); // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
    el.value = "Some new value";
    util.triggerEvent(el, "change");

    // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
    expect.equal(newSubproperty(), "Some new value");
    expect.equal(originalSubproperty(), "original value");
    expect.end();
});

it("value: Should only register one single onchange handler", expect => {
    const template = `<input type="text" bind-value="someProp" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let notifiedValues: number[] = [];
    let myobservable = px.value(123);
    myobservable.subscribe(value => { notifiedValues.push(value); });
    expect.equal(notifiedValues.length, 1);

    ui.applyBindings({ someProp: myobservable }, el);

    // Implicitly observe the number of handlers by seeing how many times "myobservable"
    // receives a new value for each onchange on the text box. If there's just one handler,
    // we'll see one new value per onchange event. More handlers cause more notifications.
    el.value = "ABC";
    util.triggerEvent(el, "change");
    expect.equal(notifiedValues.length, 2);

    el.value = "DEF";
    util.triggerEvent(el, "change");
    expect.equal(notifiedValues.length, 3);
    expect.end();
});

it("value: should update non observable values", expect => {
    const template = `<input type="text" bind-value="someProp" />`;
    const el = <HTMLInputElement> util.parse(template)[0];
    const viewModel = { someProp: "ABC" };
    ui.applyBindings(viewModel, el);

    el.value = "DEF";
    util.triggerEvent(el, "change");
    expect.equal(viewModel.someProp, "DEF");

    expect.end();
});
