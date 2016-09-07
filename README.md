# proactive extensions

Observable values themselves.
```typescript
const age: ObservableValue<number> = px.value(17);
let value: number = age(); // read current value 17
age(15); // change value
value = age(); // read again 15
```
Computed values (you can use all operators that rxjs supports)
```typescript
const isUnderAge: ComputedValue<boolean> = age.map(x => x < 18);
let bool: boolean = isUnderAge(); // true because 15 < 18
age(19);
bool = isUnderAge(); // false because 19 > 18
```
Observable arrays (they mirror the methods of Array)
```typescript
const ages: ObservableArray<number> = px.array(10, 17, 20);
ages.push(13);
value = ages.pop();
let array: number[] = ages();
ages([12, 20]);
```
Computed arrays (map/filter/reduce/some...)
```typescript
const ages: ObservableArray<number> = px.array(10, 17, 20);
const minors: ComputedArray<number> = ages.filterArray(x => x < 18);
ages.push(13);
let array: number[] = ages() // [10, 17, 13];
```