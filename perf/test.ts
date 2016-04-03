import { Suite } from "benchmark";
import * as px from "../src/proactive";

const suite = new Suite("Search");

suite.add("ComputedList#filter", () => {
        const list = px.list([]);
        const even = list.filterList(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    })
     .add("ComputedList#map", () => {
        const list = px.list([]);
        const even = list.mapList(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    })
    .add("ComputedList#some", () => {
        const list = px.list([]);
        const even = list.someList(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    })
    .add("ComputedList#every", () => {
        const list = px.list([]);
        const even = list.everyList(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    })
    .add("ComputedList#reduce", () => {
        const list = px.list([]);
        const max = list.reduceList((x, y) => x > y ? x : y, undefined);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    });

export = suite;