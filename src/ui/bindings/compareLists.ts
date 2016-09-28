export interface Delta<T> {
    status: "moved" | "deleted" | "added" | "retained";
    value: T;
    index: number;
}

function findMovesInArrayComparison<T>(left: T[], right: T[], limitFailedCompares: number) {
    if (left.length && right.length) {
        let failedCompares: number;
        let l: number;
        let r: number;
        let leftItem: T;
        let rightItem: T;
        for (failedCompares = l = 0; (!limitFailedCompares || failedCompares < limitFailedCompares) && (leftItem = left[l]); ++l) {
            for (r = 0; rightItem = right[r]; ++r) {
                if (leftItem["value"] === rightItem["value"]) {
                    leftItem["moved"] = rightItem["index"];
                    rightItem["moved"] = leftItem["index"];
                    right.splice(r, 1);         // This item is marked as moved; so remove it from right list
                    failedCompares = r = 0;     // Reset failed compares count because we're checking for consecutive failures
                    break;
                }
            }
            failedCompares += r;
        }
    }
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

    function compareSmallArrayToBigArray<T>(smlArray: T[], bigArray: T[], statusNotInSml: string, statusNotInBig: string, options: any) {
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

        const editScript: Delta<T>[] = [];
        let meMinusOne: number;
        const notInSml: Delta<T>[] = [];
        const notInBig: Delta<T>[] = [];
        for (smlIndex = smlIndexMax, bigIndex = bigIndexMax; smlIndex || bigIndex; ) {
            meMinusOne = editDistanceMatrix[smlIndex][bigIndex] - 1;
            if (bigIndex && meMinusOne === editDistanceMatrix[smlIndex][bigIndex - 1]) {
                notInSml.push(editScript[editScript.length] = <Delta<T>> {     // added
                    "status": statusNotInSml,
                    "value": bigArray[--bigIndex],
                    "index": bigIndex });
            } else if (smlIndex && meMinusOne === editDistanceMatrix[smlIndex - 1][bigIndex]) {
                notInBig.push(editScript[editScript.length] = <Delta<T>> {     // deleted
                    "status": statusNotInBig,
                    "value": smlArray[--smlIndex],
                    "index": smlIndex });
            } else {
                --bigIndex;
                --smlIndex;
                if (!options["sparse"]) {
                    editScript.push({
                        "status": "retained",
                        "value": bigArray[bigIndex],
                        "index": -1 });
                }
            }
        }

        // Set a limit on the number of consecutive non-matching comparisons; having it a multiple of
        // smlIndexMax keeps the time complexity of this algorithm linear.
        findMovesInArrayComparison(notInBig, notInSml, <any> !options["dontLimitMoves"] && smlIndexMax * 10);

        return editScript.reverse();
    }

    return compareArrays;
})();
