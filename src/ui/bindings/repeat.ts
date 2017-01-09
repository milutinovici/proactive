import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { ForEachNodeState } from "../nodeState";
import { IDataContext, INodeState, IBindingAttribute } from "../interfaces";
import { compareLists, Delta } from "./compareLists";

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

        let oldArray: T[] = [];

        const obs = bindings[0].evaluate(ctx, node, this.twoWay) as Rx.Observable<T[]>;
        // subscribe
        state.cleanup.add(obs.subscribe(array => {
            this.applyValue(parent, node, array, oldArray, placeholder);
            oldArray = array;
        }));
        state.cleanup.add(() => parent.removeChild(placeholder));
    }

    protected applyValue(parent: Element, template: Element, newArray: T[], oldArray: T[], placeholder: Node): void {
        let changes = compareLists(oldArray, newArray);

        if (changes.added.length > 0) {
            this.addRow(parent, template, changes.added, placeholder, newArray.length);
        }
        if (changes.deleted.length > 0) {
            this.removeRow(parent, changes.deleted, placeholder, newArray.length);
        }
        if (changes.moved.length > 0) {
            this.moveRow(parent, changes.moved, placeholder, newArray.length);
        }
    }

    private addRow(parent: Element, template: Element, additions: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        for (const addition of additions) {
            let node = <Element> template.cloneNode(true);
            let state = new ForEachNodeState(addition.value, addition.index);

            let before = parent.childNodes[start + addition.index];
            parent.insertBefore(node, before);

            this.domManager.nodeState.set(node, state);
            this.domManager.applyBindings(addition.value, node);

            for (let i = addition.index + 1; i < newLength; i++) {
                let after = <ForEachNodeState> this.domManager.nodeState.get(parent.childNodes[start + i]);
                if (after !== undefined) {
                    after.index.next(after.index.getValue() + 1);
                }

            }
        }
    }

    private removeRow(parent: Element, deletions: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        for (const deletion of deletions) {
            let row = <HTMLElement> parent.childNodes[start + deletion.index];
            this.domManager.cleanNode(row);

            parent.removeChild(row);

            for (let i = deletion.index; i < newLength; i++) {
                let state  = <ForEachNodeState> this.domManager.nodeState.get(parent.childNodes[start + i]);
                state.index.next(state.index.getValue() - 1);
            }
        }
    }

    private moveRow(parent: Element, moves: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        for (const move of moves) {
            let node = parent.childNodes[start + move.index];
            let before = parent.childNodes[start + move.moved];
            parent.insertBefore(node, before);
            let state = <ForEachNodeState> this.domManager.nodeState.get(node);
            state.index.next(move.moved as number);
            for (let i = Math.min(move.index, move.moved as number); i < Math.max(move.index, move.moved as number); i++) {
                let elementState  = <ForEachNodeState> this.domManager.nodeState.get(parent.childNodes[start + i]);
                elementState.index.next(elementState.index.getValue() + 1);
            }
        }
    }

}
