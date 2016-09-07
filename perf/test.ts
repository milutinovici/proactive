import { Suite } from "benchmark";
import * as px from "../src/proactive";

const suite = new Suite("Search");

suite.add("ComputedArray#filter", () => {
        const array = px.array([]);
        const even = array.filterArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
     .add("ComputedArray#map", () => {
        const array = px.array([]);
        const even = array.mapArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#some", () => {
        const array = px.array([]);
        const even = array.someArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#every", () => {
        const array = px.array([]);
        const even = array.everyArray(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#reduce", () => {
        const array = px.array([]);
        const max = array.reduceArray((x, y) => x > y ? x : y, undefined);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    });

export = suite;