import { IBindingHandler } from "../interfaces";
import { DomManager } from "../domManager";
import EventBinding from "./event";
import { IfBinding } from "./if";
import { AttrBinding, CssBinding, StyleBinding, HtmlBinding, TextBinding } from "./oneWay";
import RepeatBinding from "./repeat";
import ValueBinding from "./value";
import WithBinding from "./with";
import CheckedBinding from "./checked";
import ComponentBinding from "./component";
import KeyPressBinding from "./keypress";
import FocusBinding from "./focus";

export class BindingRegistry {

    private domManager: DomManager;
    private bindingHandlers: { [name: string]: IBindingHandler<any> } = {};

    constructor(domManager: DomManager) {
        this.domManager = domManager;
        this.registerCoreBindings();
    }

    public getHandler<T>(name: string): IBindingHandler<T> {
        return this.bindingHandlers[name];
    }
    public registerHandler<T>(name: string, handler: IBindingHandler<T>) {
        this.bindingHandlers[name] = handler;
    }

    private registerCoreBindings() {
        this.registerHandler("css", new CssBinding(this.domManager));
        this.registerHandler("attr", new AttrBinding(this.domManager));
        this.registerHandler("style", new StyleBinding(this.domManager));
        this.registerHandler("evt", new EventBinding(this.domManager));
        this.registerHandler("key", new KeyPressBinding(this.domManager));
        this.registerHandler("if", new IfBinding(this.domManager));
        this.registerHandler("with", new WithBinding(this.domManager));
        this.registerHandler("text", new TextBinding(this.domManager));
        this.registerHandler("html", new HtmlBinding(this.domManager));
        this.registerHandler("repeat", new RepeatBinding(this.domManager));

        this.registerHandler("checked", new CheckedBinding(this.domManager));
        // this.registerBinding("selectedValue", "bindings.selectedValue");
        this.registerHandler("component", new ComponentBinding(this.domManager));
        this.registerHandler("value", new ValueBinding(this.domManager));
        this.registerHandler("focus", new FocusBinding(this.domManager));
    }
}
