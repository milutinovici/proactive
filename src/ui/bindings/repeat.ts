import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { ForEachNodeState } from "../nodeState";
import { IDataContext, INodeState } from "../interfaces";
import { tryCatch } from "../utils";
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
        this.domManager.registerDataContextExtension((node: Node, ctx: IForEachDataContext) => {
            const state = <ForEachNodeState<T>> this.domManager.nodeState.get<T>(node);
            if (state.index !== undefined) {
                ctx.$index = state.index;
            }
        });
    }

    public applyBindingInternal(node: HTMLElement, obs: Rx.Observable<T[]>, ctx: IDataContext, state: INodeState<T[]>): void {
        const placeholder = document.createComment("placeholder");
        const elements: Node[] = [placeholder];
        let oldArray: T[] = [];

        // backup inner HTML
        const parent = node.parentElement;
        parent.insertBefore(placeholder, node);
        parent.removeChild(node);

        // subscribe
        state.cleanup.add(obs.subscribe(tryCatch<T[]>(array => {
            this.applyValue(elements, node, array, oldArray, placeholder);
            oldArray = array;
        })));

    }

    protected applyValue(elements: Node[], template: HTMLElement, newArray: T[], oldArray: T[], placeholder: Node): void {

        let test = compareLists(oldArray, newArray);
        for (let i = 0; i < test.length; i++) {
            if (test[i].status === "added") {
                this.addRow(elements, template, test[i].value, test[i].index, placeholder);
            } else if (test[i].status === "deleted") {
                this.removeRow(elements, test[i].index, placeholder);
            } else if (test[i].status === "moved") {
                this.moveRow(elements, test[i].index, test[i].index);
            }
        }

    }

    private addRow(elements: Node[], template: HTMLElement, item: T, index: number, placeholder: Node): INodeState<T> {
            let node = <HTMLElement> template.cloneNode(true);
            let state = new ForEachNodeState(item, index);

            let before = elements[index];
            elements[0].parentElement.insertBefore(node, before);
            elements.splice(index, 0, node);

            if (before === placeholder) {
                before.parentElement.removeChild(placeholder);
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

    private removeRow(elements: Node[], index: number, placeholder: Node) {
        let row = <HTMLElement> elements[index];
        this.domManager.cleanNode(row);

        if (elements.length === 1) {
            row.parentElement.insertBefore(placeholder, row);
            elements.push(placeholder);
        }

        row.parentElement.removeChild(row);
        elements.splice(index, 1);

        for (let i = index; i < elements.length; i++) {
            let state  = <ForEachNodeState<T>> this.domManager.nodeState.get<T>(elements[i]);
            state.index.next(state.index.getValue() - 1);
        }
    }

    private moveRow(elements: Node[], oldIndex: number, newIndex: number) {
        let node = elements[oldIndex];
        let before = elements[newIndex];
        node.parentElement.insertBefore(node, before);
        let state = <ForEachNodeState<T>> this.domManager.nodeState.get(node);
        state.index.next(newIndex);
        for (let i = Math.min(oldIndex, newIndex); i < Math.max(oldIndex, newIndex); i++) {
            let state  = <ForEachNodeState<T>> this.domManager.nodeState.get<T>(elements[i]);
            state.index.next(state.index.getValue() + 1);
        }
    }

    private getRepeatedElements(parent: HTMLElement, query: string) {
        return parent.querySelectorAll(`[bind-repeat="${query}"]`);
    }
}
