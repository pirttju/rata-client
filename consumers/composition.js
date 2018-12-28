const moment = require("moment");
const p = require("../pgconn");
const u = require ("../utils");

// Reusable set of columns
const cs_timetable_rows = new p.pgp.helpers.ColumnSet(["train_number", "departure_date", "version", "journey_index",
    "begin_station", "begin_time", "end_station", "end_time", "locomotives", "wagons", "total_length",
    "maximum_speed", "last_modified"], {table: {schema: "rata", table: "compositions"}});

exports.processMessage = function(json, callback) {
    callback(null);
}
