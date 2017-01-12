import * as Rx from "rxjs";
import { BindingBase } from "./bindingBase";
import { DomManager } from "../domManager";
import { NodeState, IndexedDataContext } from "../nodeState";
import { IDataContext, INodeState, IBindingAttribute } from "../interfaces";
import { compareLists, Delta } from "./compareLists";

export class ForBinding<T> extends BindingBase {
    public priority = 40;

    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
    }

    public applyBinding(node: Element, state: INodeState<IDataContext>): void {
        const binding = state.bindings[this.name][0] as IBindingAttribute<T[]>;
        const childContextName = binding.parameter as string;
        const parent = node.parentElement as HTMLElement;
        const placeholder: Comment = document.createComment(`for ${binding.text}`);
        // backup inner HTML
        parent.insertBefore(placeholder, node);
        parent.removeChild(node);

        let oldArray: T[] = [];
        const obs = binding.evaluate(state.context, node, this.twoWay) as Rx.Observable<T[]>;
        // subscribe
        state.cleanup.add(obs.subscribe(array => {
            this.applyValue(parent, node, state.context, childContextName, array, oldArray, placeholder);
            oldArray = array;
        }));
        state.cleanup.add(() => parent.removeChild(placeholder));
    }

    protected applyValue(parent: Element, template: Element, context: IDataContext, childContextName: string, newArray: T[], oldArray: T[], placeholder: Node): void {
        let changes = compareLists(oldArray, newArray);
        if (changes.deleted.length > 0) {
            this.removeRow(parent, changes.deleted, placeholder, newArray.length);
        }
        if (changes.added.length > 0) {
            this.addRow(parent, template, context, childContextName, changes.added, placeholder, newArray.length);
        }
        if (changes.moved.length > 0) {
            this.moveRow(parent, changes.moved, placeholder, newArray.length);
        }
    }

    private addRow(parent: Element, template: Element, context: IDataContext, childContextName: string, additions: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        // const fragment = document.createDocumentFragment();
        for (const addition of additions) {
            let node = <Element> template.cloneNode(true);

            let childState = new NodeState(context.extend(childContextName, addition.value, addition.index));

            let before = parent.childNodes[start + addition.index];
            parent.insertBefore(node, before);

            this.domManager.nodeStateManager.set(node, childState);
            this.domManager.applyBindingsRecursive(childState.context, node);

            for (let i = addition.index + 1; i < newLength; i++) {
                let siblingState = this.domManager.nodeStateManager.get(parent.childNodes[start + i]) as INodeState<IndexedDataContext>;
                if (siblingState !== undefined) {
                    siblingState.context.$index.next(siblingState.context.$index.getValue() + 1);
                }
            }
        }
        // parent.appendChild(fragment);
    }

    private removeRow(parent: Element, deletions: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        for (const deletion of deletions) {
            let row = <HTMLElement> parent.childNodes[start + deletion.index];
            this.domManager.cleanNode(row);

            parent.removeChild(row);

            for (let i = deletion.index; i < newLength; i++) {
                let siblingState  = this.domManager.nodeStateManager.get(parent.childNodes[start + i]) as INodeState<IndexedDataContext>;
                if (siblingState !== undefined) {
                    siblingState.context.$index.next(siblingState.context.$index.getValue() - 1);
                }
            }
        }
    }

    private moveRow(parent: Element, moves: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        for (const move of moves) {
            let node = parent.childNodes[start + move.index];
            let before = parent.childNodes[start + move.moved];
            parent.insertBefore(node, before);
            let state = this.domManager.nodeStateManager.get(node) as INodeState<IndexedDataContext>;
            state.context.$index.next(move.moved as number);

            for (let i = Math.min(move.index, move.moved as number); i < Math.max(move.index, move.moved as number); i++) {
                let siblingState  = this.domManager.nodeStateManager.get(parent.childNodes[start + i]) as INodeState<IndexedDataContext>;
                if (siblingState !== undefined) {
                    siblingState.context.$index.next(siblingState.context.$index.getValue() + 1);
                }
            }
        }
    }

}
