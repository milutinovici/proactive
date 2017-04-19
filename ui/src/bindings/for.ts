import { Observable } from "rxjs";
import { BaseHandler } from "./baseHandler";
import { DomManager } from "../domManager";
import { NodeState } from "../nodeState";
import { IBinding, IDataContext, INodeState, Parametricity } from "../interfaces";
import { compareLists, Delta } from "./compareLists";

export class ForBinding<T> extends BaseHandler<T[]> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 40;
        this.unique = true;
        this.parametricity = Parametricity.Required;
    }

    public applyInternal(node: Element, binding: IBinding<T[]>, state: INodeState): void {
        const observable = binding.evaluate(state.context, this.dataFlow) as Observable<T[]>;
        const childContextNames = (binding.parameter as string).split("-"); // item and index name
        const itemName = childContextNames[0];
        const indexName = childContextNames[1];
        const parent = node.parentElement as HTMLElement;
        const placeholder: Comment = document.createComment(`for ${binding.text}`);
        this.domManager.nodeStateManager.set(placeholder, state);
        // backup inner HTML
        parent.insertBefore(placeholder, node);
        let sibling = node.nextSibling;
        parent.removeChild(node);

        let oldArray: T[] = [];
        // subscribe
        binding.cleanup.add(observable.subscribe(array => {
            this.applyValue(parent, node, state.context, itemName, indexName, array, oldArray, placeholder);
            oldArray = array;
        }));
        // apply bindings after repeated elements
        if (node.nextSibling === null && sibling !== null) {
            while (sibling !== null) {
                this.domManager.applyBindingsRecursive(state.context, sibling);
                sibling = sibling.nextSibling;
            }
        }
        binding.cleanup.add(() => parent.removeChild(placeholder));
    }

    protected applyValue(parent: Element, template: Element, context: IDataContext, itemName: string, indexName: string, newArray: T[], oldArray: T[], placeholder: Node): void {
        let changes = compareLists(oldArray, newArray);
        if (changes.deleted.length > 0) {
            this.removeRows(parent, indexName, changes.deleted, placeholder, newArray.length);
        }
        if (changes.added.length > 0) {
            this.addRows(parent, template, context, itemName, indexName, changes.added, placeholder, newArray.length);
        }
        if (changes.moved.length > 0) {
            this.moveRows(parent, indexName, changes.moved, placeholder, newArray.length);
        }
    }

    private addRows(parent: Element, template: Element, context: IDataContext, itemName: string, indexName: string, additions: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        let current = 0;
        while (current <= additions.length) {
            const merger = this.mergeConsecutiveRows(additions, template, current);
            let before = parent.childNodes[start + current + additions[current].index];
            parent.insertBefore(merger.fragment, before);

            for (let i = current; i < merger.stopped; i++) {
                let childState = indexName ?
                                 new NodeState(context.extend(itemName, additions[i].value, indexName, additions[i].index)) :
                                 new NodeState(context.extend(itemName, additions[i].value));
                childState.for = true;
                this.domManager.nodeStateManager.set(parent.childNodes[i + start + additions[current].index], childState);
                this.domManager.applyBindingsRecursive(childState.context, parent.childNodes[i + start + additions[current].index]);
            }
            if (indexName) {
                for (let i = merger.stopped + 1; i < newLength; i++) {
                    let siblingState = this.domManager.nodeStateManager.get(parent.childNodes[start + i]);
                    if (siblingState !== undefined) {
                        siblingState.context[indexName].next(siblingState.context[indexName].getValue() + 1);
                    }
                }
            }
            current = merger.stopped + 1;
        }
    }

    private removeRows(parent: Element, indexName: string, deletions: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        for (const deletion of deletions) {
            let row = <HTMLElement> parent.childNodes[start + deletion.index];
            this.domManager.cleanNode(row);

            parent.removeChild(row);

            if (indexName) {
                for (let i = deletion.index; i < newLength; i++) {
                    let siblingState  = this.domManager.nodeStateManager.get(parent.childNodes[start + i]);
                    if (siblingState !== undefined) {
                        siblingState.context[indexName].next(siblingState.context[indexName].getValue() - 1);
                    }
                }
            }
        }
    }

    private moveRows(parent: Element, indexName: string, moves: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        for (const move of moves) {
            let node = parent.childNodes[start + move.index];
            let before = parent.childNodes[start + move.moved];
            parent.insertBefore(node, before);
            if (indexName) {
                let state = this.domManager.nodeStateManager.get(node) as INodeState;
                state.context[indexName].next(move.moved as number);

                for (let i = Math.min(move.index, move.moved as number); i < Math.max(move.index, move.moved as number); i++) {
                    let siblingState  = this.domManager.nodeStateManager.get(parent.childNodes[start + i]);
                    if (siblingState !== undefined) {
                        siblingState.context[indexName].next(siblingState.context[indexName].getValue() + 1);
                    }
                }
            }
        }
    }

    private mergeConsecutiveRows(additions: Delta<T>[], template: Element, start: number): Merger {
        let fragment = document.createDocumentFragment();
        for (let i = start; i < additions.length; i++) {
            fragment.appendChild(template.cloneNode(true));
            if (additions[i - 1] !== undefined && additions[i].index - additions[i - 1].index !== 1) {
                return { fragment: fragment, stopped: i + 1 };
            }
        }
        return { fragment: fragment, stopped: additions.length };
    }
}

interface Merger {
    fragment: DocumentFragment;
    stopped: number;
}
