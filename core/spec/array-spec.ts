import * as px from "../src/proactive";
import * as it from "tape";

it("is correctly initialized from default value", expect => {
    const array = [3, 2, 1];
    const obsArray = px.array<number>(array);
    expect.equal(obsArray(), array);
    expect.end();
});

it("should remove every item that satisfies the supplied selector", expect => {
    const items = px.array([1, 2, 3, 4, 5]);
    const removed = items.remove(x => x % 2 === 0);
    expect.isEquivalent(items(), [1, 3, 5]);
    expect.isEquivalent(removed, [2, 4]);
    expect.end();
});

it("push should add item to the end", expect => {
    const items = px.array([1, 2]);
    items.push(3);
    expect.isEquivalent(items(), [1, 2, 3]);
    items.push(4, 5);
    expect.isEquivalent(items(), [1, 2, 3, 4, 5]);
    expect.end();
});

it("pop should remove last item", expect => {
    const items = px.array([1, 2, 3, 4, 5]);
    const removed = items.pop();
    expect.isEquivalent(items(), [1, 2, 3, 4]);
    expect.isEquivalent(removed, 5);
    expect.end();
});
it("shift should remove 1st item", expect => {
    const items = px.array([1, 2, 3, 4, 5]);
    const removed = items.shift();
    expect.isEquivalent(items(), [2, 3, 4, 5]);
    expect.isEquivalent(removed, 1);
    expect.end();
});
it("unshift should insert item at the begining of a Array", expect => {
    const items = px.array([1, 2, 3]);
    items.unshift(0);
    expect.isEquivalent(items(), [0, 1, 2, 3]);
    expect.end();
});
it("should reverse order of items", expect => {
    const original = [1, 2, 3, 4, 5];
    const items = px.array(original);
    let reversed: number[] = [];
    items.subscribe(x => reversed = x);
    items.reverse();
    expect.isEquivalent(items(), [5, 4, 3, 2, 1]);
    expect.isEquivalent(reversed, [5, 4, 3, 2, 1]);
    expect.isInequal(original, reversed);
    expect.end();
});
it("splice should remove item range", expect => {
    const items = px.array([1, 2, 3, 4, 5]);
    let latest: number[] = [];
    items.subscribe(x => latest = x);
    const removed = items.splice(1, 3);
    expect.isEquivalent(items(), [1, 5]);
    expect.isEquivalent(removed, [2, 3, 4]);
    expect.isEquivalent(latest, [1, 5]);
    expect.end();
});
it("reverse should reverse items", expect => {
    const items = px.array([1, 2, 3]);
    let reversed: number[] = [];
    items.subscribe(x => reversed = x);
    items.reverse();
    expect.isEquivalent(items(), [3, 2, 1]);
    expect.isEquivalent(reversed, [3, 2, 1]);
    expect.end();
});
it("sort should sort items", expect => {
    const original = [1, 2, 3];
    const items = px.array(original);
    items.sort((x, y) => x < y ? 1 : -1);
    expect.isEquivalent(items(), [3, 2, 1]);
    expect.isInequal(original, items());
    expect.end();
});
it("Array is also an observer", expect => {
    const items1 = px.array([1, 2, 3]);
    const items2 = px.array([]);
    items1.subscribe(items2);
    items1.push(4);
    expect.isEquivalent(items2(), [1, 2, 3, 4]);
    expect.end();
});

it("next sets current value", expect => {
    const val = px.array([0]);
    const array = [1];
    val.next(array);

    expect.equal(val(), array);
    expect.end();
});