import { Suite } from "benchmark";
import * as px from "../src/proactive";

const suite = new Suite("Search");

suite.add("ComputedArray#filter", () => {
        const array = px.array<number>([]);
        const even = array.filterArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
     .add("ComputedArray#map", () => {
        const array = px.array<number>([]);
        const even = array.mapArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
    .add("ComputedArray#some", () => {
        const array = px.array<number>([]);
        const even = array.someArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
    .add("ComputedArray#every", () => {
        const array = px.array<number>([]);
        const even = array.everyArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
    .add("ComputedArray#reduce", () => {
        const array = px.array<number>([]);
        const max = array.reduceArray((x, y) => x > y ? x : y, 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        max.do(() => {});
    });

export = suite;
