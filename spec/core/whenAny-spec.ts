import * as px from "../../src/core/proactive";
import * as it from "tape";

it("map array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const test = px.whenAny(origin);
    const output = test.mapArray(x  => x * x);
    expect.isEquivalent(output(), [1, 4, 9]);
    origin.push(px.value(4));
    expect.isEquivalent(output(), [1, 4, 9, 16]);
    input[0](5);
    expect.isEquivalent(output(), [25, 4, 9, 16]);
    expect.end();
});
it("filter array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const output = px.whenAny(origin).filterArray(x  => x % 2 === 0);
    expect.isEquivalent(output(), [2]);
    origin.push(px.value(4));
    expect.isEquivalent(output(), [2, 4]);
    input[0](6);
    expect.isEquivalent(output(), [6, 2, 4]);
    expect.end();
});
it("map & filter array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const output = px.whenAny(origin).filterArray(x  => x % 2 === 0).mapArray(x => x * x);
    expect.isEquivalent(output(), [4]);
    origin.push(px.value(4));
    expect.isEquivalent(output(), [4, 16]);
    input[0](6);
    expect.isEquivalent(output(), [36, 4, 16]);
    expect.end();
});
it("reduce array of observables", expect => {
    const input = [px.value(1), px.value(2), px.value(3)];
    const origin = px.array(input);
    const output = px.whenAny(origin).reduceArray((x, y) => x > y ? x : y, 0);
    expect.equal(output(), 3);
    origin.push(px.value(4));
    expect.equal(output(), 4);
    input[0](6);
    expect.equal(output(), 6);
    expect.end();
});
