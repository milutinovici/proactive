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
    function compareArrays<T>(oldArray: T[], newArray: T[], options?: any) {
        // For backward compatibility, if the third arg is actually a bool, interpret
        // it as the old parameter 'dontLimitMoves'. Newer code should use { dontLimitMoves: true }.
        options = (typeof options === "boolean") ? { "dontLimitMoves": options } : (options || {});
        oldArray = oldArray || [];
        newArray = newArray || [];

        if (oldArray.length < newArray.length) {
            return compareSmallArrayToBigArray(oldArray, newArray, statusNotInOld, statusNotInNew, options);
        } else {
            return compareSmallArrayToBigArray(newArray, oldArray, statusNotInNew, statusNotInOld, options);
        }
    }

    function compareSmallArrayToBigArray<T>(smlArray: T[], bigArray: T[], statusNotInSml: "added"|"deleted", statusNotInBig: "added"|"deleted", options: any): Changes<T> {
        const myMin = Math.min;
        const myMax = Math.max;
        const editDistanceMatrix: number[] = [];
        let smlIndex: number;
        const smlIndexMax = smlArray.length;
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
            bigIndexMaxForRow = myMin(bigIndexMax, smlIndex + compareRange);
            bigIndexMinForRow = myMax(0, smlIndex - 1);
            for (bigIndex = bigIndexMinForRow; bigIndex <= bigIndexMaxForRow; bigIndex++) {
                if (!bigIndex) {
                    thisRow[bigIndex] = smlIndex + 1;
                } else if (!smlIndex) { // Top row - transform empty array into new array via additions
                    thisRow[bigIndex] = bigIndex + 1;
                } else if (smlArray[smlIndex - 1] === bigArray[bigIndex - 1]) {
                    thisRow[bigIndex] = lastRow[bigIndex - 1];                  // copy value (no edit)
                } else {
                    let northDistance = lastRow[bigIndex] || maxDistance;       // not in big (deletion)
                    let westDistance = thisRow[bigIndex - 1] || maxDistance;    // not in small (addition)
                    thisRow[bigIndex] = myMin(northDistance, westDistance) + 1;
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
                    "value": smlArray[--smlIndex],
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
