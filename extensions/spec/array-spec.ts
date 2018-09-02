import{ ObservableArray } from "../src/extensions";
import it from "ava";

it("is correctly initialized from default value", async t => {
    const array = [3, 2, 1];
    const obsArray = new ObservableArray(array);
    t.is(obsArray.getValue(), array);
});

it("should remove every item that satisfies the supplied selector", async t => {
    const items = new ObservableArray([1, 2, 3, 4, 5]);
    const removed = items.remove(x => x % 2 === 0);
    t.deepEqual(items.getValue(), [1, 3, 5]);
    t.deepEqual(removed, [2, 4]);
});

it("push should add item to the end", async t => {
    const items = new ObservableArray([1, 2]);
    items.push(3);
    t.deepEqual(items.getValue(), [1, 2, 3]);
    items.push(4, 5);
    t.deepEqual(items.getValue(), [1, 2, 3, 4, 5]);
});

it("pop should remove last item", async t => {
    const items = new ObservableArray([1, 2, 3, 4, 5]);
    const removed = items.pop();
    t.deepEqual(items.getValue(), [1, 2, 3, 4]);
    t.deepEqual(removed, 5);
});
it("shift should remove 1st item", async t => {
    const items = new ObservableArray([1, 2, 3, 4, 5]);
    const removed = items.shift();
    t.deepEqual(items.getValue(), [2, 3, 4, 5]);
    t.deepEqual(removed, 1);
});
it("unshift should insert item at the begining of a Array", async t => {
    const items = new ObservableArray([1, 2, 3]);
    items.unshift(0);
    t.deepEqual(items.getValue(), [0, 1, 2, 3]);
});
it("should reverse order of items", async t => {
    const original = [1, 2, 3, 4, 5];
    const items = new ObservableArray(original);
    let reversed: number[] = [];
    items.subscribe(x => reversed = x);
    items.reverse();
    t.deepEqual(items.getValue(), [5, 4, 3, 2, 1]);
    t.deepEqual(reversed, [5, 4, 3, 2, 1]);
    t.not(original, reversed);
});
it("splice should remove item range", async t => {
    const items = new ObservableArray([1, 2, 3, 4, 5]);
    let latest: number[] = [];
    items.subscribe(x => latest = x);
    const removed = items.splice(1, 3);
    t.deepEqual(items.getValue(), [1, 5]);
    t.deepEqual(removed, [2, 3, 4]);
    t.deepEqual(latest, [1, 5]);
});
it("reverse should reverse items", async t => {
    const items = new ObservableArray([1, 2, 3]);
    let reversed: number[] = [];
    items.subscribe(x => reversed = x);
    items.reverse();
    t.deepEqual(items.getValue(), [3, 2, 1]);
    t.deepEqual(reversed, [3, 2, 1]);
});
it("sort should sort items", async t => {
    const original = [1, 2, 3];
    const items = new ObservableArray(original);
    items.sort((x, y) => x < y ? 1 : -1);
    t.deepEqual(items.getValue(), [3, 2, 1]);
    t.not(original, items.getValue());
});
it("Array is also an observer", async t => {
    const items1 = new ObservableArray([1, 2, 3]);
    const items2 = new ObservableArray<number>([]);
    items1.subscribe(items2);
    items1.push(4);
    t.deepEqual(items2.getValue(), [1, 2, 3, 4]);
});

it("next sets current value", async t => {
    const val = new ObservableArray([0]);
    const array = [1];
    val.next(array);
    t.is(val.getValue(), array);
});
