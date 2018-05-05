# proactive extensions

Observable arrays (they mirror the methods of Array)
```typescript
const ages = new ObservableArray([10, 17, 20]);
ages.push(13);
value = ages.pop();
let array: number[] = ages.getValue();
ages.next([12, 20]);
```
Computed arrays (map/filter/reduce/some...)
```typescript
const ages = new ObservableArray([10, 17, 20]);
const minors: ComputedArray<number> = ages.filter(x => x < 18);
ages.push(13);
let array: number[] = ages.getValue() // [10, 17, 13];
```