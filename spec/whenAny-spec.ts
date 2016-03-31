import { px } from "../src/proactive";

describe("Computed Properties", () => {
    it("map list of observables", () => {
        let input = [px.property(1), px.property(2), px.property(3)];
        let origin = px.list(input);
        let test = px.whenAny(origin);
        const output = test.mapList(x  => x * x);
        expect(output()).toEqual([1, 4, 9]);
        origin.push(px.property(4));
        expect(output()).toEqual([1, 4, 9, 16]);
        input[0](5);
        expect(output()).toEqual([25, 4, 9, 16]);
    });
    it("filter list of observables", () => {
        let input = [px.property(1), px.property(2), px.property(3)];
        let origin = px.list(input);
        let output = px.whenAny(origin).filterList(x  => x % 2 === 0);
        expect(output()).toEqual([2]);
        origin.push(px.property(4));
        expect(output()).toEqual([2, 4]);
        input[0](6);
        expect(output()).toEqual([6, 2, 4]);
    });
    it("map & filter list of observables", () => {
        let input = [px.property(1), px.property(2), px.property(3)];
        let origin = px.list(input);
        let output = px.whenAny(origin).filterList(x  => x % 2 === 0).mapList(x => x * x);
        expect(output()).toEqual([4]);
        origin.push(px.property(4));
        expect(output()).toEqual([4, 16]);
        input[0](6);
        expect(output()).toEqual([36, 4, 16]);
    });
    it("reduce list of observables", () => {
        let input = [px.property(1), px.property(2), px.property(3)];
        let origin = px.list(input);
        let output = px.whenAny(origin).reduceList((x, y) => x > y ? x : y, 0);
        expect(output()).toEqual(3);
        origin.push(px.property(4));
        expect(output()).toEqual(4);
        input[0](6);
        expect(output()).toEqual(6);
    });
});