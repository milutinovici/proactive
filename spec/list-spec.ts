import * as px from "../src/proactive";

describe("Observable List", () => {
    it("is correctly initialized from default value", () => {
        let obsList = px.list<number>([3, 2, 1]);
        expect(obsList()).toEqual([3, 2, 1]);
    });

    it("isEmpty test", () => {
        let fixture = px.list<number>();
        expect(fixture.isEmpty()).toBeTruthy();
        fixture.push(1);
        expect(fixture.isEmpty()).toBeFalsy();
    });

    it("should remove every item that satisfies the supplied selector", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        const removed = items.remove(x => x % 2 === 0);
        expect(items()).toEqual([1, 3, 5]);
        expect(removed).toEqual([2, 4]);
    });

    it("push should add item to the end", () => {
        const items = px.list([1, 2]);
        items.push(3);
        expect(items()).toEqual([1, 2, 3]);
        items.push(4, 5);
        expect(items()).toEqual([1, 2, 3, 4, 5]);
    });

    it("pop should remove last item", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        const removed = items.pop();
        expect(items()).toEqual([1, 2, 3, 4]);
        expect(removed).toEqual(5);
    });
    it("shift should remove 1st item", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        const removed = items.shift();
        expect(items()).toEqual([2, 3, 4, 5]);
        expect(removed).toEqual(1);
    });
    it("unshift should insert item at the begining of a list", () => {
        const items = px.list([1, 2, 3]);
        const removed = items.unshift(0);
        expect(items()).toEqual([0, 1, 2, 3]);
    });
    it("should reverse order of items", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        let reversed: number[] = [];
        items.subscribe(x => reversed = x);
        items.reverse();
        expect(items()).toEqual([5, 4, 3, 2, 1]);
        expect(reversed).toEqual([5, 4, 3, 2, 1]);
    });
    it("splice should remove item range", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        let latest: number[] = [];
        items.subscribe(x => latest = x);
        const removed = items.splice(1, 3);
        expect(items()).toEqual([1, 5]);
        expect(removed).toEqual([2, 3, 4]);
        expect(latest).toEqual([1, 5]);
    });
    it("sort should sort items", () => {
        const items = px.list([1, 2, 3]);
        items.sort((x, y) => x < y ? 1 : -1);
        expect(items()).toEqual([3, 2, 1]);
    });
    it("list is also an observer", () => {
        const items1 = px.list([1, 2, 3]);
        const items2 = px.list([]);
        items1.subscribe(items2);
        items1.push(4);
        expect(items2()).toEqual([1, 2, 3, 4]);
    });
});