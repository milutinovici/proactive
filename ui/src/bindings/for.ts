import { Observable } from "rxjs";
import { BaseHandler } from "./baseHandler";
import { DomManager } from "../domManager";
import { NodeState } from "../nodeState";
import { HtmlEngine } from "../templateEngines";
import { IBinding, INodeState, Parametricity } from "../interfaces";
import { compareLists, Delta } from "./compareLists";

export class ForBinding<T> extends BaseHandler<T[]> {
    private readonly domManager: DomManager;
    private readonly engine: HtmlEngine;
    constructor(name: string, domManager: DomManager, engine: HtmlEngine) {
        super(name);
        this.priority = 50;
        this.unique = true;
        this.parametricity = Parametricity.Required;
        this.domManager = domManager;
        this.engine = engine;
    }

    public applyInternal(node: Element, binding: IBinding<T[]>, state: INodeState): void {
        const observable = binding.evaluate(state.scope, this.dataFlow) as Observable<T[]>;
        const parameters = (binding.parameter as string).split("-"); // item and index name
        const itemName = parameters[0];
        const indexName = parameters[1];
        const parent = node.parentElement as HTMLElement;
        const placeholder: Comment = this.engine.createComment(`for ${binding.text}`);
        this.domManager.setState(placeholder, state);
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
                this.domManager.applyBindingsRecursive(state.scope, sibling);
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
                                 new NodeState(state.scope.extend(itemName, additions[i].value, indexName, additions[i].index), otherBindings.map(x => x.clone()), state.constantProps) :
                                 new NodeState(state.scope.extend(itemName, additions[i].value), otherBindings.map(x => x.clone()), state.constantProps);

                this.domManager.setState(parent.childNodes[i + start + additions[current].index], childState);
                this.domManager.applyBindingsRecursive(childState.scope, parent.childNodes[i + start + additions[current].index]);
            }
            if (indexName) {
                for (let i = merger.stopped + 1; i < newLength; i++) {
                    let siblingState = this.domManager.getState(parent.childNodes[start + i]);
                    if (siblingState !== undefined) {
                        siblingState.scope[indexName].next(siblingState.scope[indexName].getValue() + 1);
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
                    let siblingState  = this.domManager.getState(parent.childNodes[start + i]);
                    if (siblingState !== undefined) {
                        siblingState.scope[indexName].next(siblingState.scope[indexName].getValue() - 1);
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
                let state = this.domManager.getState(node) as INodeState;
                state.scope[indexName].next(move.moved as number);

                for (let i = Math.min(move.index, move.moved as number); i < Math.max(move.index, move.moved as number); i++) {
                    let siblingState  = this.domManager.getState(parent.childNodes[start + i]);
                    if (siblingState !== undefined) {
                        siblingState.scope[indexName].next(siblingState.scope[indexName].getValue() + 1);
                    }
                }
            }
        }
    }

    private mergeConsecutiveRows(additions: Delta<T>[], template: Element, start: number): Merger {
        let fragment = this.engine.createFragment();
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
