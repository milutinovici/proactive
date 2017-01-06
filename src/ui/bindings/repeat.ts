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

export default class RepeatBinding<T> extends BindingBase<T[]> {
    public priority = 40;

    constructor(domManager: DomManager) {
        super(domManager);

        // hook into getDataContext() to map state["index"] to ctx["$index"]
        this.domManager.nodeState.registerDataContextExtension((node: Node, ctx: IForEachDataContext) => {
            const state = <ForEachNodeState<T>> this.domManager.nodeState.get<T>(node);
            if (state.index !== undefined) {
                ctx.$index = state.index;
            }
        });
    }

    public applyBinding(node: Element, bindings: IBindingAttribute<T[]>[], ctx: IDataContext, state: INodeState<T[]>): void {
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

    private addRow(parent: Element, elements: Node[], template: Element, item: T, index: number, placeholder: Node): INodeState<T> {
            let node = <Element> template.cloneNode(true);
            let state = new ForEachNodeState<T>(item, index);

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
                let after = <ForEachNodeState<T>> this.domManager.nodeState.get(elements[i]);
                if (after !== undefined) {
                    after.index.next(after.index.getValue() + 1);
                }

            }
            return state;
    }

    private removeRow(parent: Element, elements: Node[], index: number) {
        let row = <HTMLElement> elements[index];
        this.domManager.cleanNode(row);

        parent.removeChild(row);
        elements.splice(index, 1);

        for (let i = index; i < elements.length; i++) {
            let state  = <ForEachNodeState<T>> this.domManager.nodeState.get<T>(elements[i]);
            state.index.next(state.index.getValue() - 1);
        }
    }

    private moveRow(parent: Element, elements: Node[], oldIndex: number, newIndex: number) {
        let node = elements[oldIndex];
        let before = elements[newIndex + 1];
        parent.insertBefore(node, before);
        let state = <ForEachNodeState<T>> this.domManager.nodeState.get(node);
        state.index.next(newIndex);
        for (let i = Math.min(oldIndex, newIndex); i < Math.max(oldIndex, newIndex); i++) {
            let elementState  = <ForEachNodeState<T>> this.domManager.nodeState.get<T>(elements[i]);
            elementState.index.next(elementState.index.getValue() + 1);
        }
    }

}
