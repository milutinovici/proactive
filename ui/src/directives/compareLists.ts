export interface Delta<T> {
    status: "moved" | "deleted" | "added";
    value: T;
    index: number;
    moved?: number;
}
export interface Changes<T> {
    added: Delta<T>[];
    deleted: Delta<T>[];
    moved: Delta<T>[];
}

function findMovesInArrayComparison<T>(left: Delta<T>[], right: Delta<T>[], limitFailedCompares: number) {
    if (left.length && right.length) {
        const moves: Delta<T>[] = [];
        let failedCompares = 0;
        let r: number;
        for (let l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && left[l]; ++l) {
            let leftItem = left[l];
            for (r = 0; right[r]; ++r) {
                let rightItem = right[r];
                if (leftItem.value === rightItem.value) {
                    leftItem.moved = rightItem.index;
                    rightItem.moved = leftItem.index;
                    leftItem.status = "moved";
                    rightItem.status = "moved";
                    left.splice(l, 1);
                    l -= 1;
                    moves.push(...right.splice(r, 1));         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
        return moves;
    }
    return [];
};

export const compareLists = (function compareArrays() {
    const statusNotInOld = "added";
    const statusNotInNew = "deleted";

    // Simple calculation based on Levenshtein distance.
    function compareArrays<T>(old: T[] | Map<any, T>, nw: T[] | Map<any, T>, options?: any) {
        // For backward compatibility, if the third arg is actually a bool, interpret
        // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
        options = (typeof options === "boolean") ? { "dontLimitMoves": options } : (options || {});
        old = !Array.isArray(old) ? toArray(old) : old;
        nw = !Array.isArray(nw) ? toArray(nw) : nw;

        if (old.length < nw.length) {
            return compareSmallArrayToBigArray<T>(old, nw, statusNotInOld, statusNotInNew, options);
        } else {
            return compareSmallArrayToBigArray<T>(nw, old, statusNotInNew, statusNotInOld, options);
        }
    }

    function compareSmallArrayToBigArray<T>(smallArray: T[], bigArray: T[], statusNotInSml: "added"|"deleted", statusNotInBig: "added"|"deleted", options: any): Changes<T> {
        const editDistanceMatrix: number[] = [];
        let smlIndex: number;
        const smlIndexMax = smallArray.length;
        let bigIndex: number;
        const bigIndexMax = bigArray.length;
        const compareRange = (bigIndexMax - smlIndexMax) || 1;
        const maxDistance = smlIndexMax + bigIndexMax + 1;
        let thisRow: number[] = [];
        let lastRow: number[] = [];
        let bigIndexMaxForRow: number;
        let bigIndexMinForRow: number;

        for (smlIndex = 0; smlIndex <= smlIndexMax; smlIndex++) {
            lastRow = thisRow;
            editDistanceMatrix.push(thisRow = <any> []);
            bigIndexMaxForRow = Math.min(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = Math.max(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex) {
                    thisRow[bigIndex] = smlIndex + 1;
                } else if (!smlIndex) { // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                } else if (smallArray[smlIndex - 1] === bigArray[bigIndex - 1]) {
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                } else {
                    let northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    let westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = Math.min(northDistance, westDistance) + 1;
                }
            }
        }

        let meMinusOne: number;
        const notInSml: Delta<T>[] = [];
        const notInBig: Delta<T>[] = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex; ) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex - 1]) {
                notInSml.push(<Delta<T>> {     // added/deleted
                    "status": statusNotInSml,
                    "value": bigArray[--bigIndex],
                    "index": bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(<Delta<T>> {     // deleted/added
                    "status": statusNotInBig,
                    "value": smallArray[--smlIndex],
                    "index": smlIndex });
            } else {
                --bigIndex;
                --smlIndex;
            }
        }

        // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
        // smlIndexMax keeps the time complexity of this algorithm linear.
        const moves = findMovesInArrayComparison(notInBig, notInSml, <any> !options["dontLimitMoves"] && smlIndexMax * 10);
        if ((notInSml.length > 0 && notInSml[0].status === "added") || (notInBig.length > 0 && notInBig[0].status === "deleted")) {
            return { added: notInSml.reverse(), deleted: notInBig, moved: moves };
        } else {
            return { added: notInBig.reverse(), deleted: notInSml, moved: moves };
        }
    }

    return compareArrays;
})();

function toArray<T>(obj: Map<any, T> | object): T[] {
    if (obj === null || obj === undefined) {
        return [];
    } else if (obj instanceof Map) {
        const array: any[] = [];
        obj.forEach((value, key) => array.push({ key, value }));
        return array;
    } else {
        return Object.keys(obj).map(key => <any> { key: key, value: obj[key] });
    }
}
