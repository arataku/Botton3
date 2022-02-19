"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.average = void 0;
function average(array) {
    let sum = 0;
    for (let value of array) {
        sum += value;
    }
    return sum / array.length;
}
exports.average = average;
//# sourceMappingURL=Utls.js.map