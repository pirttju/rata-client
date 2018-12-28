/**
 * Some helper functions.
 */
var exports = module.exports = {};

/**
 * Filters
 */
exports.filterInt = function(val) {
    if (/^(\-|\+)?([0-9]+)$/.test(val)) {
        return Number(val);
    }
    
    return null;
}

exports.filterBoolean = function(val) {
    if (val === "undefined") {
        return null;
    } else if (val) {
        return true;
    } else {
        return false;
    }
}

exports.filterValue = function(val) {    
    if (val) return val;
    return null;
}
