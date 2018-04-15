import { Suite } from "benchmark";
import * as px from "../src/extensions";

const suite = new Suite("Search");

suite.add("ComputedArray#filter", () => {
        const array = px.array<number>([]);
        const even = array.filter(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
     .add("ComputedArray#map", () => {
        const array = px.array<number>([]);
        const even = array.map(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#some", () => {
        const array = px.array<number>([]);
        const even = array.some(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#every", () => {
        const array = px.array<number>([]);
        const even = array.every(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#reduce", () => {
        const array = px.array<number>([]);
        const max = array.reduce((x, y) => x > y ? x : y, 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    });

export = suite;
