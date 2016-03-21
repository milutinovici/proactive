export enum ChangeStatus { Added, Deleted, Moved }

export class ItemChange<T> {
    value: T;
    oldIndex: number;
    newIndex: number;
    status: ChangeStatus;
    constructor(status: ChangeStatus, value: T, oldIndex: number, newIndex: number) {
        this.status = status;
        this.value = value;
        this.oldIndex = oldIndex;
        this.newIndex = newIndex;
    }
    static add<T>(item: T, newIndex: number): ItemChange<T> {
        return new ItemChange(ChangeStatus.Added, item, undefined, newIndex);
    }
    static delete<T>(item: T, oldIndex: number): ItemChange<T> {
        return new ItemChange(ChangeStatus.Deleted, item, oldIndex, undefined);
    }
    static move<T>(item: T, oldIndex: number, newIndex: number): ItemChange<T> {
        return new ItemChange(ChangeStatus.Moved, item, oldIndex, newIndex);
    }
}
export class ListChange<T> {
    added: ItemChange<T>[];
    deleted: ItemChange<T>[];
    moved: ItemChange<T>[];
    constructor(added: ItemChange<T>[] = [], deleted: ItemChange<T>[] = [], moved: ItemChange<T>[] = []) {
        this.added = added;
        this.deleted = deleted;
        this.moved = moved;
    }
}