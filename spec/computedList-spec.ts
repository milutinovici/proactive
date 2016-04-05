import * as px from "../src/proactive";

describe("Projected Observable List", () => {
    let stringOrderer = (a: any, b: any) => {
        if (a.toString() < b.toString()) return -1;
        if (a.toString() > b.toString()) return 1;
        return 0;
    };

    let stringOrdererAsc = (a: string, b: string) => {
        if (a != null && b != null)
            return b.localeCompare(a);

        return 0;
    };

    let numberOrderer = (a: number, b: number) => {
        return a - b;
    };


    it("should follow base collection", () => {
        const input = ["Foo", "Bar", "Baz", "Bamf"];
        const origin = px.list(input);
        const output = origin.mapList(x => x.toUpperCase());

        expect(input.length).toEqual(output().length);

        origin.push("Hello");
        expect(5).toEqual(output().length);
        expect("Hello".toUpperCase()).toEqual(output()[4]);

        origin.pop();
        expect(4).toEqual(output().length);

        origin.unshift("Goodbye");
        expect(5).toEqual(output().length);
        expect("Goodbye".toUpperCase()).toEqual(output()[0]);

        origin.clear();
        expect(0).toEqual(output().length);
    });


    it("should be filtered", () => {
        let input = ["Foo", "Bar", "Baz", "Bamf"];
        let origin = px.list(input);
        let output = origin.filterList(x => x.toUpperCase().indexOf("F") !== -1);
        expect(output()).toEqual(["Foo", "Bamf"]);

        origin.push("Boof");
        expect(output()).toEqual(["Foo", "Bamf", "Boof"]);

        origin.push("Car");
        expect(output()).toEqual(["Foo", "Bamf", "Boof"]);

        const removed = origin.remove(x => x === "Bar"); // Remove "Bar"
        expect(output()).toEqual(["Foo", "Bamf", "Boof"]);

        origin.shift(); // Remove "Foo"
        expect(output()).toEqual(["Bamf", "Boof"]);
    });

    it("should be sorted", () => {
        let input = ["Foo", "Bar", "Baz"];
        let origin = px.list<string>(input);

        let output = origin.sortList(stringOrderer);

        expect(["Bar", "Baz", "Foo"]).toEqual(output());

        origin.push("Roo");
        expect(["Bar", "Baz", "Foo", "Roo"]).toEqual(output());

        origin.push("Bar");
        expect(["Bar", "Bar", "Baz", "Foo", "Roo"]).toEqual(output());
    });

    it("chaining works", () => {
        let input = ["Foo", "Bar", "Baz", "Bamf"];
        let origin = px.list(input);
        let output = origin.mapList(x => x.toUpperCase()).filterList(x => x.indexOf("F") !== -1);
        expect(output()).toEqual(["FOO", "BAMF"]);

        origin.push("Boof");
        expect(output()).toEqual(["FOO", "BAMF", "BOOF"]);

        origin.push("Car");
        expect(output()).toEqual(["FOO", "BAMF", "BOOF"]);

        origin.remove(x => x === "Bar"); // Remove "Bar"
        expect(output()).toEqual(["FOO", "BAMF", "BOOF"]);

        origin.shift(); // Remove "Foo"
        expect(output()).toEqual(["BAMF", "BOOF"]);
    });

    it("should check if every element satisfies selector", () => {
        let input = [1, 2, 4, 6];
        let origin = px.list(input);
        let output = origin.everyList(x => x % 2 === 0);
        expect(output()).toBeFalsy();

        origin.push(8);
        expect(output()).toBeFalsy();

        const removed = origin.shift(); // Remove 1
        expect(output()).toBeTruthy();

        origin.push(3);
        expect(output()).toBeFalsy();
    });
    it("should check if any element satisfies selector", () => {
        let input = [2, 3, 5, 7];
        let origin = px.list(input);
        let output = origin.someList(x => x % 2 === 0);
        expect(output()).toBeTruthy();

        origin.push(9);
        expect(output()).toBeTruthy();

        const removed = origin.shift(); // Remove 2
        expect(output()).toBeFalsy();

        origin.push(4);
        expect(output()).toBeTruthy();
    });
    it("should get max element of list using reduce", () => {
        let input = [2, 3, 5, 7, 1, 4];
        let origin = px.list(input);
        let output = origin.reduceList((x, y) => x > y ? x : y, undefined);
        expect(output()).toEqual(7);

        origin.push(9);
        expect(output()).toEqual(9);

        const removed = origin.pop();
        expect(output()).toEqual(7);

        origin.push(4);
        expect(output()).toEqual(7);
    });
    it("should flatten elements using flatMap", () => {
        let input = [[2, 3], [5, 7]];
        let origin = px.list(input);
        let output = origin.flatMapList(x => x);
        expect(output()).toEqual([2, 3, 5, 7]);

        origin.push([1, 4]);
        expect(output()).toEqual([2, 3, 5, 7, 1, 4]);

        const removed = origin.shift();
        expect(output()).toEqual([5, 7, 1, 4]);

        origin.pop();
        expect(output()).toEqual([5, 7]);
    });
});