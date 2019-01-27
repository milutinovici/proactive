import it from "ava";
import { BehaviorSubject, Subject, Subscriber } from "rxjs";
import { ProactiveUI } from "../../src/ui";
import { document, parse, triggerEvent } from "../spec-utils";

const ui = new ProactiveUI({ document });

it("event: binds a single event to a handler function", async (t) => {
    const template = `<button x-on:click="firstHandler">Click me</button>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = new TestVM();

    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    triggerEvent(el, "click");

    t.is(model.firstCount, 1, `handler was called`);
    t.is(model.firstName, "click", "click event was triggered");

    ui.clean(el);

    // should no longer fire
    triggerEvent(el, "click");

    t.is(model.firstCount, 1, "handler is not called after clean operation");

});

it("event: use shorthand for event directive", async (t) => {
    const template = `<button @click="firstHandler">Click me</button>`;
    const el = parse(template)[0] as HTMLInputElement;
    const model = new TestVM();

    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    triggerEvent(el, "click");

    t.is(model.firstCount, 1, `handler was called`);
    t.is(model.firstName, "click", "click event was triggered");

    ui.clean(el);

    // should no longer fire
    triggerEvent(el, "click");

    t.is(model.firstCount, 1, "handler is not called after clean operation");

});

it("event: binds multiple events to handler functions", async (t) => {
    const template = `<input type="text" x-on:click="firstHandler" x-on:input="secondHandler" />`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = new TestVM();

    t.notThrows(() => ui.domManager.applyDirectives(model, el));

    triggerEvent(el, "click");
    t.is(model.firstCount, 1, "click handler was called 1 time");

    el.value = "new";
    triggerEvent(el, "input");
    t.is(model.secondCount, 1, "input handler was called 1 time");

    ui.clean(el);

    triggerEvent(el, "click");
    t.is(model.firstCount, 1, "handler is not called after clean operation");

    el.value = "old";
    triggerEvent(el, "input");
    t.is(model.secondCount, 1, "handler is not called after clean operation");

});

it("event: binds multiple events to observers", async (t) => {
    const template = `<input type="text" x-on:click="clickObserver" x-on:input="inputObserver" />`;
    const el = parse(template)[0] as HTMLInputElement;

    let clickCallCount = 0;
    let inputCallCount = 0;

    const clickSubject = new Subject<Event>();
    const inputSubject = new Subject<Event>();

    const model = {
        clickObserver: new Subscriber<Event>((x) => { clickSubject.next(x); }),
        inputObserver: new Subscriber<Event>((x) => { inputSubject.next(x); }),
    };

    clickSubject.subscribe(() => clickCallCount++);
    inputSubject.subscribe(() => inputCallCount++);

    t.notThrows(() => ui.domManager.applyDirectives(model, el));

    triggerEvent(el, "click");
    t.is(clickCallCount, 1, "click observer was called 1 time");

    el.value = "new";
    triggerEvent(el, "input");
    t.is(inputCallCount, 1, "input observer was called 1 time");

    ui.clean(el);
    clickCallCount = 0;
    inputCallCount = 0;

    // should no longer fire
    triggerEvent(el, "click");
    t.is(clickCallCount, 0);

    el.value = "old";
    triggerEvent(el, "input");
    t.is(inputCallCount, 0);

});

it("event: pass parameters to function", async (t) => {
    const template = `<input type="text" x-on:click="custom(5, 2)" />`;
    const el = parse(template)[0] as HTMLInputElement;

    let first = 0;
    let second = 0;
    const model = {
        custom (f: number, s: number) { first = f; second = s; },
    };

    t.notThrows(() => ui.domManager.applyDirectives(model, el));

    triggerEvent(el, "click");
    t.is(first, 5, "1st parameter is good");
    t.is(second, 2, "2nd parameter is good");

});

it("event: binds a single key to a handler function", async (t) => {
    const template = `<input x-key:enter="firstHandler"/>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = new TestVM();

    t.notThrows(() => ui.domManager.applyDirectives(model, el));
    t.is(model.firstCount, 0, "call count is initially 0");

    triggerEvent(el, "keydown", 13);
    t.is(model.firstCount, 1,  "call count is 1 after pressing enter");

    triggerEvent(el, "keydown", 14);
    t.is(model.firstCount, 1, "call count is still 1 after pressing another key");

    ui.clean(el);

    triggerEvent(el, "click");
    t.is(model.firstCount, 1, "not called, after clean operation");

});

it("event: binds multiple keys to handler functions", async (t) => {
    const template = `<input type="text" x-key:tab="firstHandler" x-key:enter="secondHandler"/>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = new TestVM();

    t.notThrows(() => ui.domManager.applyDirectives(model, el));

    t.is(model.firstCount, 0);
    t.is(model.firstCount, 0);

    triggerEvent(el, "keydown", 9);
    t.is(model.firstCount, 1);

    el.value = "new";
    triggerEvent(el, "keydown", 13);
    t.is(model.secondCount, 1);

    ui.clean(el);

    triggerEvent(el, "keydown", 9);
    t.is(model.firstCount, 1, "should no longer fire");

    el.value = "old";
    triggerEvent(el, "keydown", 13);
    t.is(model.secondCount, 1, "should no longer fire");

});

it("event: binds a modified key to a handler function", async (t) => {
    const template = `<input type="text" x-key:shift-enter="firstHandler"/>`;
    const el = parse(template)[0] as HTMLInputElement;

    const model = new TestVM();

    t.notThrows(() => ui.domManager.applyDirectives(model, el));

    t.is(model.firstCount, 0);

    triggerEvent(el, "keydown", 13, "shift");
    t.is(model.firstCount, 1);

    el.value = "new";
    triggerEvent(el, "keydown", 13);
    t.is(model.firstCount, 1);


});

it("event: event delegation works", async (t) => {
    const template = `<ul x-on:click.a="select">
                        <li><a id="1">Click to select</a></li>
                        <li><button id="2">Click to select</button></li>
                      </ul>`;
    const el = parse(template)[0] as HTMLElement;

    const viewmodel = {
        selected: new BehaviorSubject(0),
        select(e: Event) { this.selected.next(parseInt(e.target ? ((e.target) as Element).id : "")); },
    };

    t.notThrows(() => ui.domManager.applyDirectives(viewmodel, el));
    triggerEvent(el.children[0].children[0], "click");
    t.is(viewmodel.selected.getValue(), 1);
    triggerEvent(el.children[1].children[0], "click");
    t.is(viewmodel.selected.getValue(), 1);

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
