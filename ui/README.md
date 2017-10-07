# proactive ui

Define a component
```typescript
import { Observable } from "rxjs";
class MyComponent {
    greeting: Observable<string>;
    constructor(props) {
        this.greeting = Observable.interval(500).map(x => props.greeting + Array(x + 1).join("!"));
    }

}
export const template = `<span x-text="greeting"></span>`
export const viewmodel = MyComponent
```
startup.ts
```typescript
import { ProactiveUI } from "@proactive/ui";
import * as myComponent from "./mycomponent";

const ui = new ProactiveUI();
ui.components.register("my-component", myComponent);
ui.applyBindings({}, document.body);
```
index.html
```html
<!DOCTYPE html>
<html lang="en">
    <body>
        <my-component x-attr-greeting="'Hello world'"></my-component>
        <script src="./startup.js"></script>
    </body>
</html>
```