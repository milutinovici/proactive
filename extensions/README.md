# proactive extensions

Observable arrays (they mirror the methods of Array)
```typescript
const ages = new ObservableArray([10, 17, 20]);
let array = [];
ages.subscribe(arr =>{ 
    array = arr; 
}); // array = [10, 17, 20]
ages.push(13); // array = [10, 17, 20, 13]
value = ages.pop(); // array = [10, 17, 20]
ages.next([12, 20]); // array = [12, 20]
```
Computed arrays (map/filter/reduce/some...)
```typescript
const ages = new ObservableArray([10, 17, 20]);
const minors: ComputedArray<number> = ages.filter(x => x < 18);
let array = [];
minors.subscribe(arr =>{ 
    array = arr; 
}); // array = [10, 17]
ages.push(13); // array = [10, 17, 13];
ages.push(22); // array = [10, 17, 13];
```