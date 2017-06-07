import * as px from "../src/proactive";
import * as it from "tape";

it("map array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const computed = px.whenAny(origin)._map(x => x * x);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [1, 4, 9]);
    origin.push(px.value(4));
    expect.isEquivalent(output, [1, 4, 9, 16]);
    input[0](5);
    expect.isEquivalent(output, [25, 4, 9, 16]);
    expect.end();
});
it("filter array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const computed = px.whenAny(origin)._filter(x => x % 2 === 0);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [2]);
    origin.push(px.value(4));
    expect.isEquivalent(output, [2, 4]);
    input[0](6);
    expect.isEquivalent(output, [6, 2, 4]);
    expect.end();
});
it("map & filter array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const computed = px.whenAny(origin)._filter(x => x % 2 === 0)._map(x => x * x);

    let output: number[] = [];
    computed.subscribe(x => output = x);

    expect.isEquivalent(output, [4]);
    origin.push(px.value(4));
    expect.isEquivalent(output, [4, 16]);
    input[0](6);
    expect.isEquivalent(output, [36, 4, 16]);
    expect.end();
});
it("reduce array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const computed = px.whenAny(origin)._reduce((x, y) => x > y ? x : y, 0);

    let output: number = 0;
    computed.subscribe(x => output = x);

    expect.equal(output, 3);
    origin.push(px.value(4));
    expect.equal(output, 4);
    input[0](6);
    expect.equal(output, 6);
    expect.end();
});
