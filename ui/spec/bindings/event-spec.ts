import * as it from "tape";
import * as Rx from "rxjs";
import { document, parse, triggerEvent } from "../spec-utils";
import { ProactiveUI } from "../../src/ui";

const ui = new ProactiveUI(document);

it("event: binds a single event to a handler function", expect => {
    const template = `<button x-on-click="clickHandler">Click me</button>`;
    const el = <HTMLInputElement> parse(template)[0];

    let called = false;
    let eventName: string | undefined = undefined;
    let callCount = 0;

    let model = {
        clickHandler: (e: Event) => {
            callCount++;
            called = true;
            eventName = e.type;
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    triggerEvent(el, "click");

    expect.true(called, "handler was called");
    expect.equal(eventName, "click", "click event was triggered");
    expect.equal(callCount, 1, "event was triggered once");

    ui.cleanNode(el);
    called = false;

    // should no longer fire
    triggerEvent(el, "click");

    expect.false(called, "handler is not called after clean operation");
    expect.end();
});

it("event: binds multiple events to handler functions", expect => {
    const template = `<input type="text" x-on-click="clickHandler" x-on-input="inputHandler" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let clickCallCount = 0;
    let inputCallCount = 0;

    let model = {
        clickHandler: (e: Event) => {
            clickCallCount++;
        },
        inputHandler: (e: Event) => {
            inputCallCount++;
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));

    triggerEvent(el, "click");
    expect.equal(clickCallCount, 1, "click handler was called 1 time");

    el.value = "new";
    triggerEvent(el, "input");
    expect.equal(inputCallCount, 1, "input handler was called 1 time");

    ui.cleanNode(el);
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

it("event: binds multiple events to observers", expect => {
    const template = `<input type="text" x-on-click="clickObserver" x-on-input="inputObserver" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let clickCallCount = 0;
    let inputCallCount = 0;

    let clickSubject = new Rx.Subject<Event>();
    let inputSubject = new Rx.Subject<Event>();

    let model = {
        clickObserver: new Rx.Subscriber<Event>((x) => { clickSubject.next(x); }),
        inputObserver: new Rx.Subscriber<Event>((x) => { inputSubject.next(x); }),
    };

    clickSubject.subscribe(() => clickCallCount++);
    inputSubject.subscribe(() => inputCallCount++);

    expect.doesNotThrow(() => ui.applyBindings(model, el));

    triggerEvent(el, "click");
    expect.equal(clickCallCount, 1, "click observer was called 1 time");

    el.value = "new";
    triggerEvent(el, "input");
    expect.equal(inputCallCount, 1, "input observer was called 1 time");

    ui.cleanNode(el);
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
    const template = `<input type="text" x-on-click="custom(5, 2)" />`;
    const el = <HTMLInputElement> parse(template)[0];

    let first = 0;
    let second = 0;
    let model = {
        custom: function (f: number, s: number) { first = f; second = s; },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));

    triggerEvent(el, "click");
    expect.equal(first, 5, "1st parameter is good");
    expect.equal(second, 2, "2nd parameter is good");

    expect.end();
});

it("event: binds a single key to a handler function", expect => {
    const template = `<input x-key-enter="clickHandler"/>`;
    const el = <HTMLInputElement> parse(template)[0];
    let callCount = 0;

    let model = {
        clickHandler: (on: KeyboardEvent) => {
            callCount++;
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(callCount === 0, "call count is initially 0");

    triggerEvent(el, "keydown", 13);

    expect.true(callCount === 1,  "call count is 1 after pressing enter");

    triggerEvent(el, "keydown", 14);
    expect.true(callCount === 1, "call count is still 1 after pressing another key");

    ui.cleanNode(el);
    callCount = 0;

    // should no longer fire
    triggerEvent(el, "click");

    expect.true(callCount === 0, "not called, after clean operation");
    expect.end();
});

it("event: binds multiple keys to handler functions", expect => {
    const template = `<input type="text" x-key-tab="clickHandler" x-key-enter="inputHandler"/>`;
    const el = <HTMLInputElement> parse(template)[0];

    let clickCallCount = 0;
    let inputCallCount = 0;

    let model = {
        clickHandler: (e: Event) => {
            clickCallCount++;
        },
        inputHandler: (e: Event) => {
            inputCallCount++;
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));

    expect.equal(clickCallCount, 0);
    expect.equal(inputCallCount, 0);

    triggerEvent(el, "keydown", 9);
    expect.equal(clickCallCount, 1);

    el.value = "new";
    triggerEvent(el, "keydown", 13);
    expect.equal(inputCallCount, 1);

    ui.cleanNode(el);
    clickCallCount = 0;
    inputCallCount = 0;

    // should no longer fire
    triggerEvent(el, "keydown", 9);
    expect.equal(clickCallCount, 0);

    el.value = "old";
    triggerEvent(el, "keydown", 13);
    expect.equal(inputCallCount, 0);
    expect.end();
});

it("event: event delegation works", expect => {
    const template = `<ul x-on-click-id="console.log">
                        <li><a id="1">Click to select</a></li>
                        <li><a id="2">Click to select</a></li>
                      </ul>`;
    const el = <HTMLElement> parse(template)[0];

    const viewModel = {
        selected: new Rx.BehaviorSubject(0),
    };

    expect.doesNotThrow(() => ui.applyBindings(viewModel, el));
    triggerEvent(el.children[0].children[0], "click");
    triggerEvent(el.children[1].children[0], "click");
    expect.fail("it doesn't actually work");
    expect.end();
});

class TestVM {
    public constant = "hello";
    public clickHandler(e: Event) {
        this.constant = "world";
    }
}
