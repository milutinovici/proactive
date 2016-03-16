import { px } from "../src/proactive";
import { List } from "../src/list";
import { Observable, Subject, Symbol } from "rxjs/Rx";

describe("Observable List", () => {
    it("is correctly initialized from default value", () => {
        let obsList = px.list<number>([3, 2, 1]);
        expect(obsList()).toEqual([3, 2, 1]);
    });

    it("length property is not ambiguous", () => {
        let obsList = px.list<number>();
        const length = obsList.size.toComputed();
        expect(0).toEqual(length());
        let list = obsList();
        expect(0).toEqual(list.length);
    });

    it("indexer is not ambiguous", () => {
        let obsList = px.list<number>([ 0, 1 ]);
        expect(0).toEqual(obsList()[0]);
    });


    it("length changed test", () => {
        let fixture = px.list<number>();
        let output = new Array<number>();
        const size = fixture.size.toComputed();
        fixture.size.subscribe(x => output.push(x));

        fixture.push(10);
        fixture.push(20);
        fixture.push(30);

        expect(size()).toEqual(3);

        fixture.pop();
        expect(size()).toEqual(2);

        fixture.clear();
        expect(size()).toEqual(0);

        let results = [1, 2, 3, 2, 0 ];
        expect(results.length).toEqual( output.length);
        expect(results).toEqual(output);
    });

    it("length changed test 2", () => {
        let list = px.list();
        const length = list.size.toComputed();
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }

        expect(length()).toEqual(100);

        list.clear();
        expect(length()).toEqual(0);
    });

    it("isEmpty test", () => {
        let fixture = px.list<number>();
        expect(fixture.isEmpty()).toBeTruthy();
        fixture.push(1);
        expect(fixture.isEmpty()).toBeFalsy();
    });

    it("length changed fires when clearing", () => {
        let items = px.list<Object>([new Object()]);
        let lengthChanged = false;

        items.size.subscribe(_ => { lengthChanged = true; });

        items.clear();

        expect(lengthChanged).toBeTruthy();
    });

    it("should remove every item that satisfies the supplied selector", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        const removed = items.remove(x => x % 2 === 0);
        expect(items()).toEqual([1, 3, 5]);
        expect(removed).toEqual([2, 4]);
    });

    it("should remove last item using pop", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        const removed = items.pop();
        expect(items()).toEqual([1, 2, 3, 4]);
        expect(removed).toEqual(5);
    });
    it("should remove 1st item using shift", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        const removed = items.shift();
        expect(items()).toEqual([2, 3, 4, 5]);
        expect(removed).toEqual(1);
    });
    it("should reverse order of items", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        let reversed: number[] = [];
        items.subscribe(x => reversed = x);
        items.reverse();
        expect(items()).toEqual([5, 4, 3, 2, 1]);
        expect(reversed).toEqual([5, 4, 3, 2, 1]);
    });
    it("should remove range using splice", () => {
        const items = px.list([1, 2, 3, 4, 5]);
        let latest: number[] = [];
        items.subscribe(x => latest = x);
        const removed = items.splice(1, 3);
        expect(items()).toEqual([1, 5]);
        expect(removed).toEqual([2, 3, 4]);
        expect(latest).toEqual([1, 5]);
    });
});