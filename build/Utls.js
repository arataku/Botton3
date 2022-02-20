"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.average = void 0;
function average(array) {
    let sum = 0;
    for (let value of array) {
        sum += value;
    }
    return sum / array.length;
}
exports.average = average;
async function sleep(waitTime) {
    return new Promise((resolve) => setTimeout(resolve, waitTime));
}
exports.sleep = sleep;
//# sourceMappingURL=Utls.js.map