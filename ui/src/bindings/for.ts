import { Observable } from "rxjs";
import { BaseHandler } from "./baseHandler";
import { DomManager } from "../domManager";
import { NodeState } from "../nodeState";
import { IBinding, INodeState, Parametricity } from "../interfaces";
import { compareLists, Delta } from "./compareLists";

export class ForBinding<T> extends BaseHandler<T[]> {
    constructor(name: string, domManager: DomManager) {
        super(name, domManager);
        this.priority = 50;
        this.unique = true;
        this.parametricity = Parametricity.Required;
    }

    public applyInternal(node: Element, binding: IBinding<T[]>, state: INodeState): void {
        const observable = binding.evaluate(state.context, this.dataFlow) as Observable<T[]>;
        const parameters = (binding.parameter as string).split("-"); // item and index name
        const itemName = parameters[0];
        const indexName = parameters[1];
        const parent = node.parentElement as HTMLElement;
        const placeholder: Comment = this.domManager.engine.createComment(`for ${binding.text}`);
        this.domManager.nodeStateManager.set(placeholder, state);
        // backup inner HTML
        parent.insertBefore(placeholder, node);
        let sibling = node.nextSibling;
        parent.removeChild(node);

        let oldArray: T[] = [];
        // subscribe
        binding.cleanup.add(observable.subscribe(array => {
            let changes = compareLists(oldArray, array);
            if (changes.deleted.length > 0) {
                this.removeRows(parent, indexName, changes.deleted, placeholder, array.length);
            }
            if (changes.added.length > 0) {
                this.addRows(parent, node, state, itemName, indexName, changes.added, placeholder, array.length);
            }
            if (changes.moved.length > 0) {
                this.moveRows(parent, indexName, changes.moved, placeholder, array.length);
            }
            oldArray = array;
        }));
        // apply bindings after repeated elements
        if (node.nextSibling === null && sibling !== null) {
            while (sibling !== null) {
                this.domManager.applyBindingsRecursive(state.context, sibling);
                sibling = sibling.nextSibling;
            }
        }
        // cleanup after itself
        binding.cleanup.add(() => {
            let changes = compareLists(oldArray, []);
            this.removeRows(parent, indexName, changes.deleted, placeholder, 0);
            parent.removeChild(placeholder);
            this.domManager.cleanNode(node);
            parent.appendChild(node);
        });
    }

    private addRows(parent: Element, template: Element, state: INodeState, itemName: string, indexName: string, additions: Delta<T>[], placeholder: Node, newLength: number) {
        const start = Array.prototype.indexOf.call(parent.childNodes, placeholder) + 1;
        let current = 0;
        const otherBindings = state.bindings.filter(x => x.handler.name !== "for");

        while (current <= additions.length) {
            const merger = this.mergeConsecutiveRows(additions, template, current);
            let before = parent.childNodes[start + current + additions[current].index];
            parent.insertBefore(merger.fragment, before);

            for (let i = current; i < merger.stopped; i++) {
                let childState = indexName ?
                                 new NodeState(state.context.extend(itemName, additions[i].value, indexName, additions[i].index), otherBindings.map(x => x.clone())) :
                                 new NodeState(state.context.extend(itemName, additions[i].value), otherBindings.map(x => x.clone()));

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
        let fragment = this.domManager.engine.createFragment();
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
