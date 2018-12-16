/*
Process train messages.
*/
const p = require("../pgconn");
const u = require ("../utils");
const moment = require("moment");
const async = require("async");

// Reusable set of columns
const cs_trains = new p.pgp.helpers.ColumnSet(["train_number", "departure_date", "operator_code", "train_type",
    "commuter_line_id", "running_currently", "cancelled", "version", "timetable_type", "acceptance_date", "deleted",
    "last_modified"], {schema: "rail", table: "trains"});

const cs_timetables = new p.pgp.helpers.ColumnSet(["train_number", "departure_date", "row_key", "train_stopping",
    "station_code", "row_type", "commercial_stop", "commercial_track", "cancelled", "scheduled_time", "estimate_source",
    "unknown_delay", "actual_time", "diff_in_minutes", "actual_track", "cause_code", "train_ready"], 
    {schema: "rail", table: "timetables"});

exports.processMessage = function(body, callback) {
    let data;

    try {
        data = JSON.parse(body);
    } catch (e) {
        return callback("JSON parse failed");
    }

    async.eachSeries(data, function(item, next) {
        processTrain(data, function() {
            next();
        });
    }, function(err) {
        callback();
    });
}

function processTrain(data, callback) {
    // TODO
    callback();
};
