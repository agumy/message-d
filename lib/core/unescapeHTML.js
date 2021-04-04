"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unescapeHTML = void 0;
var unescapeHTML = function (target) {
    var patterns = {
        "&lt;": "<",
        "&gt;": ">",
        "&amp;": "&",
        "&quot;": '"',
        "&#x27;": "'",
        "&#x60;": "`",
    };
    return target.replace(/&(lt|gt|amp|quot|#x27|#x60);/g, function (match) {
        var _a;
        return (_a = patterns[match]) !== null && _a !== void 0 ? _a : "";
    });
};
exports.unescapeHTML = unescapeHTML;
