import * as it from "tape";
import { Observable } from "rxjs";
import * as px from "@proactive/extensions";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
const ui = new ProactiveUI({ document });

it("value: Should treat null values as empty strings", expect => {
    const template = `<input type="text" x-value="myProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    ui.domManager.applyDirectives({ myProp: px.value(0) }, el);
    expect.equal(el.value, "0");
    expect.end();
});

it("value: Should assign an empty string as value if the model value is undefined", expect => {
    const template = `<input type="text" x-value="undefined" />`;
    const el = <HTMLInputElement> parse(template)[0];

    ui.domManager.applyDirectives({ }, el);
    expect.equal(el.value, "");
    expect.end();
});

it("value: For observable values, should unwrap the value and update on change", expect => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let myobservable = px.value(123);
    ui.domManager.applyDirectives({ someProp: myobservable }, el);
    expect.equal(el.value, "123");
    myobservable(456);
    expect.equal(el.value, "456");
    expect.end();
});

it("value: For observable values, should update on change if new value is 'strictly' different from previous value", expect => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let myobservable = px.value<string | number>("+123");
    ui.domManager.applyDirectives({ someProp: myobservable }, el);
    expect.equal(el.value, "+123");
    myobservable(123);
    expect.equal(el.value, "123");
    expect.end();
});

it("value: For writeable observable values, should catch the node's onchange and write values back to the observable", expect => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let myobservable = px.value(123);
    ui.domManager.applyDirectives({ someProp: myobservable }, el);
    el.value = "some user-entered value";
    triggerEvent(el, "change");

    myobservable.subscribe(x => {
        expect.equal(x, "some user-entered value");
        expect.end();
    });

});

it("value: Should ignore node changes when bound to a read-only observable", expect => {
    const template = `<input type="text" x-value="prop" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let observable = Observable.of("zzz");
    let vm = { prop: observable };
    let value = "";
    observable.subscribe(x => value = x);
    ui.domManager.applyDirectives(vm, el);
    expect.equal(el.value, "zzz");

    // Change the input value and trigger change event; verify that the view model wasn't changed
    el.value = "yyy";
    triggerEvent(el, "change");
    expect.equal(vm.prop, observable);
    observable.subscribe(x => value = x);
    expect.equal(value, "zzz");
    expect.end();
});

// it("value: Should be able to write to observable subproperties of an observable, even after the parent observable has changed", expect => {
//     // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
//     // Set up a text box whose value is linked to the subproperty of the observable's current value
//     const template = `<input type="text" x-value="myprop.subproperty" />`;
//     const el = <HTMLInputElement> parse(template)[0];

//     let originalSubproperty = px.value("original value");
//     let newSubproperty = px.value<string>();
//     let model = { myprop: px.value<any>({ subproperty: originalSubproperty }) };

//     ui.domManager.applyDirectives(model, el);
//     expect.equal(el.value, "original value");

//     model.myprop({ subproperty: newSubproperty }); // Note that myprop (and hence its subproperty) is changed *after* the directives are applied
//     el.value = "Some new value";
//     triggerEvent(el, "change");

//     // Verify that the change was written to the *new* subproperty, not the one referenced when the directives were first established
//     expect.equal(newSubproperty(), "Some new value");
//     expect.equal(originalSubproperty(), "original value");
//     expect.end();
// });

it("value: Should only register one single onchange handler", expect => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let notifiedValues: number[] = [];
    let myobservable = px.value(123);
    myobservable.subscribe(value => { notifiedValues.push(value); });
    expect.equal(notifiedValues.length, 1);

    ui.domManager.applyDirectives({ someProp: myobservable }, el);

    // Implicitly observe the number of handlers by seeing how many times "myobservable"
    // receives a new value for each onchange on the text box. If there's just one handler,
    // we'll see one new value per onchange event. More handlers cause more notifications.
    el.value = "ABC";
    triggerEvent(el, "change");
    expect.equal(notifiedValues.length, 2);

    el.value = "DEF";
    triggerEvent(el, "change");
    expect.equal(notifiedValues.length, 3);
    expect.end();
});

it("value: should update non observable values", expect => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];
    const viewModel = { someProp: "ABC" };
    ui.domManager.applyDirectives(viewModel, el);

    el.value = "DEF";
    triggerEvent(el, "change");
    expect.equal(viewModel.someProp, "DEF");

    expect.end();
});

it("value: input values type should be consistent", expect => {
    const template = `<input type="number" x-value="someProp" />`;
    const number = px.value(0);
    const el = <HTMLInputElement> parse(template)[0];
    const viewModel = { someProp: number };
    ui.domManager.applyDirectives(viewModel, el);

    el.value = "3";
    triggerEvent(el, "change");
    expect.equal(4, 1 + number());

    expect.end();
});

it("value: select multiple can be bound to an array", expect => {
    const template = `<select multiple x-value="selected">
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>`;
    const selected = px.array<string>([]);
    const el = <HTMLSelectElement> parse(template)[0];
    const viewModel = { selected };
    ui.domManager.applyDirectives(viewModel, el);
    selected.push("A");
    expect.equal(el.options[0]["selected"], true);

    el.options[1]["selected"] = true;
    triggerEvent(el, "change");
    expect.equal(selected().length, 2);

    expect.end();
});
