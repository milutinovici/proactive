import * as it from "tape";
import * as Rx from "rxjs";
import * as px from "../../../src/core/proactive";
import * as ui from "../../../src/ui/app";
import * as util from "../spec-utils";

it("event: this is bound to $data", expect => {
    const template = `<button bind-evt-click="clickHandler">Click me</button>`;
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
    const template = `<button bind-evt-click="clickHandler">Click me</button>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let called = false;
    let eventName: string | undefined = undefined;
    let calledWithValidContext = false;
    let calledWithValidEvent = false;
    let callCount = 0;

    let model = {
        clickHandler: (e: Event, element: HTMLElement, ctx: Object) => {
            callCount++;
            called = true;
            eventName = e.type;

            if (ctx.hasOwnProperty("$data")) {
                calledWithValidContext = true;
            }
            if (e instanceof window["Event"]) {
                calledWithValidEvent = true;
            }
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));

    util.triggerEvent(el, "click");

    expect.true(called, "handler was called");
    expect.equal(eventName, "click", "click event was triggered");
    expect.true(calledWithValidContext, "valid context was passed as parameter");
    expect.true(calledWithValidEvent, "event passed is instance of window['Event']");

    ui.cleanNode(el);
    called = false;

    // should no longer fire
    util.triggerEvent(el, "click");

    expect.false(called, "handler is not called after clean operation");
    expect.end();
});

it("event: binds multiple events to handler functions", expect => {
    const template = `<input type="text" bind-evt-click="clickHandler" bind-evt-input="inputHandler" />`;
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
    const template = `<input type="text" bind-evt-click="clickObserver" bind-evt-input="inputObserver" />`;
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
    const template = `<div bind-key-enter="clickHandler">Click me</div>`;
    const el = <HTMLInputElement> util.parse(template)[0];

    let calledWithValidContext = false;
    let callCount = 0;

    let model = {
        clickHandler: (evt: KeyboardEvent, element: HTMLInputElement, ctx: Object) => {
            callCount++;

            if (ctx.hasOwnProperty("$data")) {
                calledWithValidContext = true;
            }
        },
    };

    expect.doesNotThrow(() => ui.applyBindings(model, el));
    expect.true(callCount === 0, "call count is initially 0");

    util.triggerEvent(el, "keydown", 13);

    expect.true(callCount === 1,  "call count is 1 after pressing enter");
    expect.true(calledWithValidContext, "called with valid context");

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
    const template = `<div type="text" bind-key-tab="clickHandler" bind-key-enter="inputHandler"></div>`;
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

class TestVM {
    public constant = "hello";
    public clickHandler(e: Event, el: HTMLElement, ctx: any) {
        this.constant = "world";
    }
}
