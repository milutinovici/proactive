import * as it from "tape";
import * as Rx from "rxjs";
import * as ui from "../../src/proactiveUI";
import * as util from "../spec-utils";

it("event: this is bound to $data", expect => {
    const template = `<button x-on-click="clickHandler">Click me</button>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let model = new TestVM();

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(model.constant = "hello");
    util.triggerEvent(el, "click");
    expect.true(model.constant = "world");
    ui.cleanNode(el);
    expect.end();
});

it("event: binds a single event to a handler function", expect => {
    const template = `<button x-on-click="clickHandler">Click me</button>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let called = false;
    let eventName: string | undefined = undefined;
    let calledWithValidEvent = false;
    let callCount = 0;

    let model = {
        clickHandler: (e: Event, element: HTMLElement, ctx: Object) => {
            callCount++;
            called = true;
            eventName = e.type;

            if (e instanceof window["Event"]) {
                calledWithValidEvent = true;
            }
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    util.triggerEvent(el, "click");

    expect.true(called, "handler was called");
    expect.equal(eventName, "click", "click event was triggered");
    expect.true(calledWithValidEvent, "event passed is instance of window['Event']");

    ui.cleanNode(el);
    called = false;

    // should no longer fire
    util.triggerEvent(el, "click");

    expect.false(called, "handler is not called after clean operation");
    expect.end();
});

it("event: binds multiple events to handler functions", expect => {
    const template = `<input type="text" x-on-click="clickHandler" x-on-input="inputHandler" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let clickCallCount = 0;
    let inputCallCount = 0;

    let model = {
        clickHandler: (e: Event, element: Element) => {
            clickCallCount++;
        },
        inputHandler: (e: Event, element: Element) => {
            inputCallCount++;
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));

    util.triggerEvent(el, "click");
    expect.equal(clickCallCount, 1, "click handler was called 1 time");

    el.value = "new";
    util.triggerEvent(el, "input");
    expect.equal(inputCallCount, 1, "input handler was called 1 time");

    ui.cleanNode(el);
    clickCallCount = 0;
    inputCallCount = 0;

    // should no longer fire
    util.triggerEvent(el, "click");
    expect.equal(clickCallCount, 0);

    el.value = "old";
    util.triggerEvent(el, "input");
    expect.equal(inputCallCount, 0);
    expect.end();
});

it("event: binds multiple events to observers", expect => {
    const template = `<input type="text" x-on-click="clickObserver" x-on-input="inputObserver" />`;
    const el = <HTMLInputElement> util.parse(template)[0];

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

    util.triggerEvent(el, "click");
    expect.equal(clickCallCount, 1, "click observer was called 1 time");

    el.value = "new";
    util.triggerEvent(el, "input");
    expect.equal(inputCallCount, 1, "input observer was called 1 time");

    ui.cleanNode(el);
    clickCallCount = 0;
    inputCallCount = 0;

    // should no longer fire
    util.triggerEvent(el, "click");
    expect.equal(clickCallCount, 0);

    el.value = "old";
    util.triggerEvent(el, "input");
    expect.equal(inputCallCount, 0);
    expect.end();
});

it("event: binds a single key to a handler function", expect => {
    const template = `<input x-key-enter="clickHandler"/>`;
    const el = <HTMLInputElement> util.parse(template)[0];
    let callCount = 0;

    let model = {
        clickHandler: (on: KeyboardEvent, element: HTMLInputElement, ctx: Object) => {
            callCount++;
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(callCount === 0, "call count is initially 0");

    util.triggerEvent(el, "keydown", 13);

    expect.true(callCount === 1,  "call count is 1 after pressing enter");

    util.triggerEvent(el, "keydown", 14);
    expect.true(callCount === 1, "call count is still 1 after pressing another key");

    ui.cleanNode(el);
    callCount = 0;

    // should no longer fire
    util.triggerEvent(el, "click");

    expect.true(callCount === 0, "not called, after clean operation");
    expect.end();
});

it("event: binds multiple keys to handler functions", expect => {
    const template = `<input type="text" x-key-tab="clickHandler" x-key-enter="inputHandler"/>`;
    const el = <HTMLInputElement> util.parse(template)[0];

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

    util.triggerEvent(el, "keydown", 9);
    expect.equal(clickCallCount, 1);

    el.value = "new";
    util.triggerEvent(el, "keydown", 13);
    expect.equal(inputCallCount, 1);

    ui.cleanNode(el);
    clickCallCount = 0;
    inputCallCount = 0;

    // should no longer fire
    util.triggerEvent(el, "keydown", 9);
    expect.equal(clickCallCount, 0);

    el.value = "old";
    util.triggerEvent(el, "keydown", 13);
    expect.equal(inputCallCount, 0);
    expect.end();
});

it("event: event delegation works", expect => {
    const template = `<ul x-on-click-item="selected">
                        <li><a item="1">Click to select</a></li>
                        <li><a item="2">Click to select</a></li>
                      </ul>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    const viewModel = {
        selected: new Rx.BehaviorSubject(0),
    };

    expect.doesNotThrow(() => ui.applyBindings(viewModel, el));

    expect.end();
});

class TestVM {
    public constant = "hello";
    public clickHandler(e: Event, el: HTMLElement, ctx: any) {
        this.constant = "world";
    }
}
