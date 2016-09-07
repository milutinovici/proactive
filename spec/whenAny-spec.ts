import * as px from "../src/proactive";

describe("Computed Values", () => {
    it("map array of observables", () => {
        let input = [px.value(1), px.value(2), px.value(3)];
        let origin = px.array(input);
        let test = px.whenAny(origin);
        const output = test.mapArray(x  => x * x);
        expect(output()).toEqual([1, 4, 9]);
        origin.push(px.value(4));
        expect(output()).toEqual([1, 4, 9, 16]);
        input[0](5);
        expect(output()).toEqual([25, 4, 9, 16]);
    });
    it("filter array of observables", () => {
        let input = [px.value(1), px.value(2), px.value(3)];
        let origin = px.array(input);
        let output = px.whenAny(origin).filterArray(x  => x % 2 === 0);
        expect(output()).toEqual([2]);
        origin.push(px.value(4));
        expect(output()).toEqual([2, 4]);
        input[0](6);
        expect(output()).toEqual([6, 2, 4]);
    });
    it("map & filter array of observables", () => {
        let input = [px.value(1), px.value(2), px.value(3)];
        let origin = px.array(input);
        let output = px.whenAny(origin).filterArray(x  => x % 2 === 0).mapArray(x => x * x);
        expect(output()).toEqual([4]);
        origin.push(px.value(4));
        expect(output()).toEqual([4, 16]);
        input[0](6);
        expect(output()).toEqual([36, 4, 16]);
    });
    it("reduce array of observables", () => {
        let input = [px.value(1), px.value(2), px.value(3)];
        let origin = px.array(input);
        let output = px.whenAny(origin).reduceArray((x, y) => x > y ? x : y, 0);
        expect(output()).toEqual(3);
        origin.push(px.value(4));
        expect(output()).toEqual(4);
        input[0](6);
        expect(output()).toEqual(6);
    });
});