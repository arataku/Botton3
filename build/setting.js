"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingRead = exports.settingSet = void 0;
var fs = require("fs");
function settingSet(keys, value) {
    const json = require("./setting.json");
    let tmp = json;
    for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i] in tmp) {
            tmp = tmp[keys[i]];
        }
        else {
            tmp[keys[i]] = {};
            tmp = tmp[keys[i]];
        }
    }
    tmp[keys[keys.length - 1]] = value;
    fs.writeFileSync("./setting.json", JSON.stringify(json));
}
exports.settingSet = settingSet;
function settingRead(keys) {
    const json = require("./setting.json");
    let tmp = json;
    for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i] in tmp) {
            tmp = tmp[keys[i]];
        }
        else {
            tmp[keys[i]] = {};
            tmp = tmp[keys[i]];
        }
    }
    if (keys[keys.length - 1] in tmp) {
        return tmp[keys[keys.length - 1]];
    }
    else {
        return null;
    }
}
exports.settingRead = settingRead;
//# sourceMappingURL=setting.js.map