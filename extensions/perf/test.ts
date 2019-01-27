import { Suite } from "benchmark";
import { ObservableArray } from "../src/extensions";

const suite = new Suite("Search");

suite.add("ComputedArray#filter", () => {
        const array = new ObservableArray<number>([]);
        const even = array.filter(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
     .add("ComputedArray#map", () => {
        const array = new ObservableArray<number>([]);
        const even = array.map(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#some", () => {
        const array = new ObservableArray<number>([]);
        const even = array.some(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#every", () => {
        const array = new ObservableArray<number>([]);
        const even = array.every(x => x % 2 === 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    })
    .add("ComputedArray#reduce", () => {
        const array = new ObservableArray<number>([]);
        const max = array.reduce((x, y) => x > y ? x : y, 0);
        for (let i = 0; i < 100; i++) {
            array.push(i);
        }
    });

suite.run({ async: true });
export default suite;
