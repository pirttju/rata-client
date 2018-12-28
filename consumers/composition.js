const moment = require("moment");
const p = require("../pgconn");
const u = require ("../utils");

// Reusable set of columns
const cs_compositions = new p.pgp.helpers.ColumnSet(["train_number", "departure_date"],
    {schema: "rail", table: "compositions"});

exports.processMessage = function(json, callback) {
    callback(null);
}
