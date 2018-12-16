/*
Process composition messages.
*/
var p = require("../pgconn");
const u = require ("../utils");
const moment = require("moment");

// Reusable set of columns
const cs_compositions = new p.pgp.helpers.ColumnSet(["train_number", "departure_date"],
    {schema: "rail", table: "compositions"});

    exports.processMessage = function(body, callback) {
    let data;

    try {
        data = JSON.parse(body);
    } catch (e) {
        return callback("JSON parse failed");
    }

    async.eachSeries(data, function(item, next) {
        processComposition(data, function() {
            next();
        });
    }, function(err) {
        return callback();
    });
}

function processComposition(data, callback) {
    // TODO
    callback();
};
