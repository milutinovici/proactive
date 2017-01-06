import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { ForEachNodeState } from "../nodeState";
import { IDataContext, INodeState, IBindingAttribute } from "../interfaces";
import { compareLists } from "./compareLists";

// Binding contributions to data-context
interface IForEachDataContext extends IDataContext {
    $index: Rx.Observable<number>;
}

export class RepeatBinding<T> extends BindingBase {
    public priority = 40;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);

        // hook into getDataContext() to map state["index"] to ctx["$index"]
        this.domManager.nodeState.registerDataContextExtension((node: Node, ctx: IForEachDataContext) => {
            const state = <ForEachNodeState> this.domManager.nodeState.get(node);
            if (state.index !== undefined) {
                ctx.$index = state.index;
            }
        });
    }

    public applyBinding(node: Element, state: INodeState, ctx: IDataContext): void {
        const bindings = state.bindings[this.name] as IBindingAttribute<T[]>[];
        const parent = node.parentElement as HTMLElement;
        const placeholder: Comment = document.createComment(`repeat ${bindings[0].text}`);
        // backup inner HTML
        parent.insertBefore(placeholder, node);
        parent.removeChild(node);

        const elements: Node[] = [];
        let oldArray: T[] = [];

        const obs = bindings[0].evaluate(ctx, node, this.twoWay) as Rx.Observable<T[]>;
        // subscribe
        state.cleanup.add(obs.subscribe(array => {
            this.applyValue(parent, elements, node, array, oldArray, placeholder);
            oldArray = array;
        }));
        state.cleanup.add(() => parent.removeChild(placeholder));
    }

    protected applyValue(parent: Element, elements: Node[], template: Element, newArray: T[], oldArray: T[], placeholder: Node): void {
        let changes = compareLists(oldArray, newArray);
        for (const change of changes) {
            if (change.status === "added") {
                this.addRow(parent, elements, template, change.value, change.index, placeholder);
            } else if (change.status === "deleted") {
                this.removeRow(parent, elements, change.index);
            } else if (change.status === "moved") {
                this.moveRow(parent, elements, change.index, change.moved || 0);
            }
        }
    }

    private addRow(parent: Element, elements: Node[], template: Element, item: T, index: number, placeholder: Node) {
            let node = <Element> template.cloneNode(true);
            let state = new ForEachNodeState(item, index);

            let before = elements[index];
            parent.insertBefore(node, before);
            elements.splice(index, 0, node);

            if (before === placeholder) {
                parent.removeChild(placeholder);
                elements.pop();
            }
            this.domManager.nodeState.set(node, state);
            this.domManager.applyBindings(item, node);

            for (let i = index + 1; i < elements.length; i++) {
                let after = <ForEachNodeState> this.domManager.nodeState.get(elements[i]);
                if (after !== undefined) {
                    after.index.next(after.index.getValue() + 1);
                }

            }
    }

    private removeRow(parent: Element, elements: Node[], index: number) {
        let row = <HTMLElement> elements[index];
        this.domManager.cleanNode(row);

        parent.removeChild(row);
        elements.splice(index, 1);

        for (let i = index; i < elements.length; i++) {
            let state  = <ForEachNodeState> this.domManager.nodeState.get(elements[i]);
            state.index.next(state.index.getValue() - 1);
        }
    }

    private moveRow(parent: Element, elements: Node[], oldIndex: number, newIndex: number) {
        let node = elements[oldIndex];
        let before = elements[newIndex + 1];
        parent.insertBefore(node, before);
        let state = <ForEachNodeState> this.domManager.nodeState.get(node);
        state.index.next(newIndex);
        for (let i = Math.min(oldIndex, newIndex); i < Math.max(oldIndex, newIndex); i++) {
            let elementState  = <ForEachNodeState> this.domManager.nodeState.get(elements[i]);
            elementState.index.next(elementState.index.getValue() + 1);
        }
    }

}
