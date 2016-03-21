import { Suite } from "benchmark";
import { px } from "../src/proactive";

const suite = new Suite("Search");

suite.add("ComputedList#filter", () => {
        const list = px.list([]);
        const even = list.filterList(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    })
    .add("ComputedList#filterInc", () => {
        const list = px.list([]);
        const even = list.filterInc(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    })
    .add("ComputedList#mapList", () => {
        const list = px.list([]);
        const even = list.mapList(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    })
    .add("ComputedList#mapInc", () => {
        const list = px.list([]);
        const even = list.mapInc(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            list.push(i);
        }
    });
export = suite;