# proactive ui

Define a component
```typescript
import { Observable, interval } from "rxjs";
class GreetingComponent {
    name: string;
    exclamations: Observable<string>;
    constructor(props) {
        this.name = props.name;
        this.exclamations = interval(500).pipe(map(x => Array(x + 1).join("!")));
    }

}
export const template = `<span>Hello, {{name}}. Welcome{{exclamations}}</span>`
export const viewmodel = MyComponent
```
startup.ts
```typescript
import { ProactiveUI } from "@proactive/ui";
import * as greeting from "./greeting-component";

const ui = new ProactiveUI();
ui.components.register("my-greet", greeting);
ui.render({}, document.body);
```
index.html
```html
<!DOCTYPE html>
<html lang="en">
    <body>
        <my-greet name="John"></my-greet>
        <script src="./startup.js"></script>
    </body>
</html>
```