import it from "ava";
import { BehaviorSubject, of } from "rxjs";
import { ObservableArray } from "@proactive/extensions";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";
const ui = new ProactiveUI({ document });

it("value: Should treat null values as empty strings", async t => {
    const template = `<input type="text" x-value="myProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    ui.domManager.applyDirectives({ myProp: new BehaviorSubject(0) }, el);
    t.is(el.value, "0");
    
});

it("value: Should assign an empty string as value if the model value is undefined", async t => {
    const template = `<input type="text" x-value="undefined" />`;
    const el = <HTMLInputElement> parse(template)[0];

    ui.domManager.applyDirectives({ }, el);
    t.is(el.value, "");
    
});

it("value: For observable values, should unwrap the value and update on change", async t => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(123);
    ui.domManager.applyDirectives({ someProp: myobservable }, el);
    t.is(el.value, "123");
    myobservable.next(456);
    t.is(el.value, "456");
    
});

it("value: For observable values, should update on change if new value is 'strictly' different from previous value", async t => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject<string | number>("+123");
    ui.domManager.applyDirectives({ someProp: myobservable }, el);
    t.is(el.value, "+123");
    myobservable.next(123);
    t.is(el.value, "123");
    
});

it("value: For writeable observable values, should catch the node's onchange and write values back to the observable", async t => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let myobservable = new BehaviorSubject(123);
    ui.domManager.applyDirectives({ someProp: myobservable }, el);
    el.value = "some user-entered value";
    triggerEvent(el, "change");

    myobservable.subscribe(x => {
        t.is(x.toString(), "some user-entered value");
        
    });

});

it("value: Should ignore node changes when bound to a read-only observable", async t => {
    const template = `<input type="text" x-value="prop" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let observable = of("zzz");
    let vm = { prop: observable };
    let value = "";
    observable.subscribe(x => value = x);
    ui.domManager.applyDirectives(vm, el);
    t.is(el.value, "zzz");

    // Change the input value and trigger change event; verify that the view model wasn't changed
    el.value = "yyy";
    triggerEvent(el, "change");
    t.is(vm.prop, observable);
    observable.subscribe(x => value = x);
    t.is(value, "zzz");
    
});

// it("value: Should be able to write to observable subproperties of an observable, even after the parent observable has changed", async t => {
//     // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
//     // Set up a text box whose value is linked to the subproperty of the observable's current value
//     const template = `<input type="text" x-value="myprop.subproperty" />`;
//     const el = <HTMLInputElement> parse(template)[0];

//     let originalSubproperty = new BehaviorSubject("original value");
//     let newSubproperty = new BehaviorSubject<string>();
//     let model = { myprop: new BehaviorSubject<any>({ subproperty: originalSubproperty }) };

//     ui.domManager.applyDirectives(model, el);
//     t.is(el.value, "original value");

//     model.myprop({ subproperty: newSubproperty }); // Note that myprop (and hence its subproperty) is changed *after* the directives are applied
//     el.value = "Some new value";
//     triggerEvent(el, "change");

//     // Verify that the change was written to the *new* subproperty, not the one referenced when the directives were first established
//     t.is(newSubproperty(), "Some new value");
//     t.is(originalSubproperty(), "original value");
//     
// });

it("value: Should only register one single onchange handler", async t => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let notifiedValues: number[] = [];
    let myobservable = new BehaviorSubject(123);
    myobservable.subscribe(value => { notifiedValues.push(value); });
    t.is(notifiedValues.length, 1);

    ui.domManager.applyDirectives({ someProp: myobservable }, el);

    // Implicitly observe the number of handlers by seeing how many times "myobservable"
    // receives a new value for each onchange on the text box. If there's just one handler,
    // we'll see one new value per onchange event. More handlers cause more notifications.
    el.value = "ABC";
    triggerEvent(el, "change");
    t.is(notifiedValues.length, 2);

    el.value = "DEF";
    triggerEvent(el, "change");
    t.is(notifiedValues.length, 3);
    
});

it("value: should update non observable values", async t => {
    const template = `<input type="text" x-value="someProp" />`;
    const el = <HTMLInputElement> parse(template)[0];
    const viewmodel = { someProp: "ABC" };
    ui.domManager.applyDirectives(viewmodel, el);

    el.value = "DEF";
    triggerEvent(el, "change");
    t.is(viewmodel.someProp, "DEF");

    
});

it("value: input values type should be consistent", async t => {
    const template = `<input type="number" x-value="someProp" />`;
    const number = new BehaviorSubject(0);
    const el = <HTMLInputElement> parse(template)[0];
    const viewmodel = { someProp: number };
    ui.domManager.applyDirectives(viewmodel, el);

    el.value = "3";
    triggerEvent(el, "change");
    t.is(4, 1 + number.getValue());

    
});

it("value: select multiple can be bound to an array", async t => {
    const template = `<select multiple x-value="selected">
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>`;
    const selected = new ObservableArray<string>([]);
    const el = <HTMLSelectElement> parse(template)[0];
    const viewmodel = { selected };
    ui.domManager.applyDirectives(viewmodel, el);
    selected.push("A");
    t.is(el.options[0]["selected"], true, "Dataflow.Out");
    el.options[1]["selected"] = true;
    triggerEvent(el, "change");
    t.is(selected.getValue().length, 2, "Dataflow.In");

    
});
