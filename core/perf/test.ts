import { Suite } from "benchmark";
import * as px from "../src/proactive";

const suite = new Suite("Search");

suite.add("ComputedArray#filter", () => {
        const array = px.array<number>([]);
        const even = array._filter(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
     .add("ComputedArray#map", () => {
        const array = px.array<number>([]);
        const even = array._map(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
    .add("ComputedArray#some", () => {
        const array = px.array<number>([]);
        const even = array._some(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
    .add("ComputedArray#every", () => {
        const array = px.array<number>([]);
        const even = array._every(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        even.do(() => {});
    })
    .add("ComputedArray#reduce", () => {
        const array = px.array<number>([]);
        const max = array._reduce((x, y) => x > y ? x : y, 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
        max.do(() => {});
    });

export = suite;
