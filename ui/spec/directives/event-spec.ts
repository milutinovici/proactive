import * as it from "tape";
import { BehaviorSubject, Subject, Subscriber } from "rxjs";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";

const ui = new ProactiveUI({ document });

it("event: binds a single event to a handler function", expect => {
    const template = `<button x-on:click="firstHandler">Click me</button>`;
    const el = <HTMLInputElement> parse(template)[0];

    const model = new TestVM();

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    triggerEvent(el, "click");

    expect.equal(model.firstCount, 1, `handler was called`);
    expect.equal(model.firstName, "click", "click event was triggered");

    ui.clean(el);

    // should no longer fire
    triggerEvent(el, "click");

    expect.equal(model.firstCount, 1, "handler is not called after clean operation");
    expect.end();
});

it("event: use shorthand for event directive", expect => {
    const template = `<button @click="firstHandler">Click me</button>`;
    const el = <HTMLInputElement> parse(template)[0];
    const model = new TestVM();

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    triggerEvent(el, "click");

    expect.equal(model.firstCount, 1, `handler was called`);
    expect.equal(model.firstName, "click", "click event was triggered");

    ui.clean(el);

    // should no longer fire
    triggerEvent(el, "click");

    expect.equal(model.firstCount, 1, "handler is not called after clean operation");
    expect.end();
});

it("event: binds multiple events to handler functions", expect => {
    const template = `<input type="text" x-on:click="firstHandler" x-on:input="secondHandler" />`;
    const el = <HTMLInputElement> parse(template)[0];

    const model = new TestVM();

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));

    triggerEvent(el, "click");
    expect.equal(model.firstCount, 1, "click handler was called 1 time");

    el.value = "new";
    triggerEvent(el, "input");
    expect.equal(model.secondCount, 1, "input handler was called 1 time");

    ui.clean(el);

    triggerEvent(el, "click");
    expect.equal(model.firstCount, 1, "handler is not called after clean operation");

    el.value = "old";
    triggerEvent(el, "input");
    expect.equal(model.secondCount, 1, "handler is not called after clean operation");
    expect.end();
});

it("event: binds multiple events to observers", expect => {
    const template = `<input type="text" x-on:click="clickObserver" x-on:input="inputObserver" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let clickCallCount = 0;
    let inputCallCount = 0;

    let clickSubject = new Subject<Event>();
    let inputSubject = new Subject<Event>();

    let model = {
        clickObserver: new Subscriber<Event>((x) => { clickSubject.next(x); }),
        inputObserver: new Subscriber<Event>((x) => { inputSubject.next(x); }),
    };

    clickSubject.subscribe(() => clickCallCount++);
    inputSubject.subscribe(() => inputCallCount++);

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));

    triggerEvent(el, "click");
    expect.equal(clickCallCount, 1, "click observer was called 1 time");

    el.value = "new";
    triggerEvent(el, "input");
    expect.equal(inputCallCount, 1, "input observer was called 1 time");

    ui.clean(el);
    clickCallCount = 0;
    inputCallCount = 0;

    // should no longer fire
    triggerEvent(el, "click");
    expect.equal(clickCallCount, 0);

    el.value = "old";
    triggerEvent(el, "input");
    expect.equal(inputCallCount, 0);
    expect.end();
});

it("event: pass parameters to function", expect => {
    const template = `<input type="text" x-on:click="custom(5, 2)" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let first = 0;
    let second = 0;
    let model = {
        custom: function (f: number, s: number) { first = f; second = s; },
    };

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));

    triggerEvent(el, "click");
    expect.equal(first, 5, "1st parameter is good");
    expect.equal(second, 2, "2nd parameter is good");

    expect.end();
});

it("event: binds a single key to a handler function", expect => {
    const template = `<input x-key:enter="firstHandler"/>`;
    const el = <HTMLInputElement> parse(template)[0];

    let model = new TestVM();

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));
    expect.equal(model.firstCount, 0, "call count is initially 0");

    triggerEvent(el, "keydown", 13);
    expect.equal(model.firstCount, 1,  "call count is 1 after pressing enter");

    triggerEvent(el, "keydown", 14);
    expect.equal(model.firstCount, 1, "call count is still 1 after pressing another key");

    ui.clean(el);

    triggerEvent(el, "click");
    expect.equal(model.firstCount, 1, "not called, after clean operation");
    expect.end();
});

it("event: binds multiple keys to handler functions", expect => {
    const template = `<input type="text" x-key:tab="firstHandler" x-key:enter="secondHandler"/>`;
    const el = <HTMLInputElement> parse(template)[0];

    let model = new TestVM();

    expect.doesNotThrow(() => ui.domManager.applyDirectives(model, el));

    expect.equal(model.firstCount, 0);
    expect.equal(model.firstCount, 0);

    triggerEvent(el, "keydown", 9);
    expect.equal(model.firstCount, 1);

    el.value = "new";
    triggerEvent(el, "keydown", 13);
    expect.equal(model.secondCount, 1);

    ui.clean(el);

    triggerEvent(el, "keydown", 9);
    expect.equal(model.firstCount, 1, "should no longer fire");

    el.value = "old";
    triggerEvent(el, "keydown", 13);
    expect.equal(model.secondCount, 1, "should no longer fire");
    expect.end();
});

it("event: event delegation works", expect => {
    const template = `<ul x-on:click.a="select">
                        <li><a id="1">Click to select</a></li>
                        <li><a id="2">Click to select</a></li>
                      </ul>`;
    const el = <HTMLElement> parse(template)[0];

    const viewmodel = {
        selected: new BehaviorSubject(0),
        select: function(e: Event) { this.selected.next(parseInt(e.target["id"])); },
    };

    expect.doesNotThrow(() => ui.domManager.applyDirectives(viewmodel, el));
    triggerEvent(el.children[0].children[0], "click");
    expect.equal(viewmodel.selected.getValue(), 1);
    triggerEvent(el.children[1].children[0], "click");
    expect.equal(viewmodel.selected.getValue(), 2);
    expect.end();
});

class TestVM {
    public firstCount = 0;
    public firstName = "";
    public secondCount = 0;
    public secondName = "";
    public firstHandler(e: Event) {
        this.firstCount += 1;
        this.firstName = e.type;
    }
    public secondHandler(e: Event) {
        this.secondCount += 1;
        this.secondName = e.type;
    }
}
