# Proactive UI

### Define a component `hello-component.ts`
```typescript
import { Observable, interval } from "rxjs";

class HelloComponent {
    exclamations: Observable<string>;
    constructor(props) {
        this.exclamations = interval(500).pipe(map(x => Array(x + 1).join("!")));
    }
}

export const template = `<span>Hello, world{{exclamations}}</span>`
export const viewmodel = MyComponent
```
### Start it up `startup.ts`
```typescript
import { ProactiveUI } from "@proactive/ui";
import * as hello from "./hello-component";

const ui = new ProactiveUI();
ui.render(hello, document.body);
```
