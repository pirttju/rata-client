const moment = require("moment");
const p = require("../pgconn");
const u = require ("../utils");

// Reusable set of columns
const cs_trains = new p.pgp.helpers.ColumnSet(["train_number", "departure_date", "operator_code", "train_type",
    "commuter_line_id", "running_currently", "cancelled", "version", "timetable_type", "acceptance_date",
    "begin_station", "begin_time", "end_station", "end_time", "last_modified"], {table: {schema: "rata", table: "trains"}});

const cs_timetable_rows = new p.pgp.helpers.ColumnSet(["train_number", "departure_date", "row_index", "train_stopping",
    "station", "commercial_stop", "commercial_track", "arr_cancelled", "arr_scheduled", "arr_estimate", "arr_unknown_delay",
    "arr_actual", "arr_minutes", "arr_cause_code", "dep_cancelled", "dep_scheduled", "dep_estimate", "dep_unknown_delay",
    "dep_actual", "dep_minutes", "dep_cause_code", "train_ready", "train_ready_src", "train_passed"], 
    {table: {schema: "rata", table: "timetablerows"}});

exports.processMessage = function(json, callback) {
    prepareTrain(json, function(err, data) {
        if (err) return callback(err);

        upsert(data, function (err, results) {
            // Done
            if (err) {
                console.log(err);
            }
            if (data.timeTableRows.length != results[1].rowCount) {
                console.log(moment().toISOString(), data.train.train_number, data.train.departure_date, "length of data:", data.timeTableRows.length, ", rows updated:", results[1].rowCount);
            }
            callback();
        });
    });
}

function prepareTrain(data, callback) {
    const timeTableRows = [];
    const length = data.timeTableRows.length;
    let row_index = 0;
    let j = 0;

    for (let i = 0; i <= length; i = i + 2) {
        // Coalesce cause codes into one column
        // Store third category codes as 300xx, detailed category codes as 200xx
        let arrCauseCode = null;
        let depCauseCode = null;

        if (i > 0 && Array.isArray(data.timeTableRows[i-1].causes)) {
            if (data.timeTableRows[i-1].causes.length > 0) {
                if (data.timeTableRows[i-1].causes[0].thirdCategoryCodeId) {
                    arrCauseCode = data.timeTableRows[i-1].causes[0].thirdCategoryCodeId + 30000;
                } else if (data.timeTableRows[i-1].causes[0].detailedCategoryCodeId) {
                    arrCauseCode = data.timeTableRows[i-1].causes[0].detailedCategoryCodeId + 20000;
                } else if (data.timeTableRows[i-1].causes[0].categoryCodeId) {
                    arrCauseCode = data.timeTableRows[i-1].causes[0].categoryCodeId;
                }
            }
        }

        if (i < length && Array.isArray(data.timeTableRows[i].causes)) {
            if (data.timeTableRows[i].causes.length > 0) {
                if (data.timeTableRows[i].causes[0].thirdCategoryCodeId) {
                    depCauseCode = data.timeTableRows[i].causes[0].thirdCategoryCodeId + 30000;
                } else if (data.timeTableRows[i].causes[0].detailedCategoryCodeId) {
                    depCauseCode = data.timeTableRows[i].causes[0].detailedCategoryCodeId + 20000;
                } else if (data.timeTableRows[i].causes[0].categoryCodeId) {
                    depCauseCode = data.timeTableRows[i].causes[0].categoryCodeId;
                }
            }
        }

        // "Train ready" bit
        let trainReady = null;
        let trainReadySrc = null;

        if (i < length && data.timeTableRows[i].trainReady) {
            if (data.timeTableRows[i].trainReady.accepted) {
                try {
                    trainReady = data.timeTableRows[i].trainReady.timestamp;
                    trainReadySrc = data.timeTableRows[i].trainReady.source;
                } catch (e) {
                    trainReady = null;
                    trainReadySrc = null;
                }
            }
        }

        let trainPassed = null;
        if (i > 0 && i < length) {
            trainPassed = data.timeTableRows[i-1].actualTime === data.timeTableRows[i].actualTime;
        }

        if (i > 0) j = i - 1;

        const timeTableRow = {
            train_number: u.filterInt(data.trainNumber),
            departure_date: u.filterValue(data.departureDate),
            row_index: row_index,
            train_stopping: u.filterBoolean(data.timeTableRows[j].trainStopping),
            station: u.filterValue(data.timeTableRows[j].stationShortCode),
            commercial_stop: u.filterBoolean(data.timeTableRows[j].commercialStop),
            commercial_track: u.filterValue(data.timeTableRows[j].commercialTrack),
            train_passed: trainPassed,
            arr_cancelled: i > 0 ? u.filterBoolean(data.timeTableRows[i-1].cancelled) : null,
            arr_scheduled: i > 0 ? u.filterValue(data.timeTableRows[i-1].scheduledTime) : null,
            arr_estimate: i > 0 ? u.filterValue(data.timeTableRows[i-1].liveEstimateTime) : null,
            arr_unknown_delay: i > 0 ? u.filterBoolean(data.timeTableRows[i-1].unknownDelay) : null,
            arr_actual: i > 0 ? u.filterValue(data.timeTableRows[i-1].actualTime) : null,
            arr_minutes: i > 0 ? u.filterInt(data.timeTableRows[i-1].differenceInMinutes) : null,
            arr_cause_code: arrCauseCode,
            dep_cancelled: i < length ? u.filterBoolean(data.timeTableRows[i].cancelled) : null,
            dep_scheduled: i < length ? u.filterValue(data.timeTableRows[i].scheduledTime) : null,
            dep_estimate: i < length ? u.filterValue(data.timeTableRows[i].liveEstimateTime) : null,
            dep_unknown_delay: i < length ? u.filterBoolean(data.timeTableRows[i].unknownDelay) : null,
            dep_actual: i < length ? u.filterValue(data.timeTableRows[i].actualTime) : null,
            dep_minutes: i < length ? u.filterInt(data.timeTableRows[i].differenceInMinutes) : null,
            dep_cause_code: depCauseCode,
            train_ready: trainReady,
            train_ready_src: trainReadySrc
        };

        timeTableRows.push(timeTableRow);

        row_index++;
    }

    const last = timeTableRows.length - 1;

    const train = {
        train_number: u.filterInt(data.trainNumber),
        departure_date: u.filterValue(data.departureDate),
        operator_code: u.filterValue(data.operatorShortCode),
        train_type: u.filterValue(data.trainType),
        commuter_line_id: u.filterValue(data.commuterLineID),
        running_currently: u.filterBoolean(data.runningCurrently),
        cancelled: u.filterBoolean(data.cancelled),
        version: u.filterInt(data.version),
        timetable_type: u.filterValue(data.timetableType),
        acceptance_date: u.filterValue(data.timetableAcceptanceDate),
        begin_station: timeTableRows[0].station,
        begin_time: timeTableRows[0].dep_scheduled,
        end_station: timeTableRows[last].station,
        end_time: timeTableRows[last].arr_scheduled,
        last_modified: moment().toISOString()
    };

    callback(null, {train: train, timeTableRows: timeTableRows});
}

function upsert(data, callback) {
    p.db.task(t => {
        const q1 = t.result(p.pgp.helpers.insert(data.train, cs_trains) +
        " ON CONFLICT(train_number, departure_date) DO UPDATE SET " +
            cs_trains.assignColumns({from: 'EXCLUDED', skip: ["train_number", "departure_date"]}));
        const q2 = t.result(p.pgp.helpers.insert(data.timeTableRows, cs_timetable_rows) +
        " ON CONFLICT(train_number, departure_date, row_index) DO UPDATE SET " +
            cs_timetable_rows.assignColumns({from: 'EXCLUDED', skip: ["train_number", "departure_date", "row_index"]}));

        return t.batch([q1, q2]);
    })
    .then(data => {
        return callback(null, data);
    })
    .catch(error => {
        return callback(error);
    });
}
