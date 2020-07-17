const p = require("../pgconn");
const u = require ("../utils");

// Reusable set of columns
const cs_trains = new p.pgp.helpers.ColumnSet([
    "departure_date",
    "train_number",
    "train_type",
    "commuter_line_id",
    "operator_code",
    "running_currently",
    "cancelled",
    "version",
    "adhoc_timetable",
    "acceptance_date",
    "begin_station",
    "begin_time",
    "end_station",
    "end_time",
    {name: "last_modified", mod: "^", def: "CURRENT_TIMESTAMP"}
], {table: {table: "trains", schema: "public"}});

const cs_timetablerows = new p.pgp.helpers.ColumnSet([
    "departure_date",
    "train_number",
    "row_index",
    "station",
    "train_stopping",
    "commercial_stop",
    "commercial_track",
    "arr_cancelled",
    "arr_scheduled",
    "arr_estimate",
    "arr_unknown_delay",
    "arr_actual",
    "arr_minutes",
    "arr_cause_code",
    "dep_cancelled",
    "dep_scheduled",
    "dep_estimate",
    "dep_unknown_delay",
    "dep_actual",
    "dep_minutes",
    "dep_cause_code",
    "train_ready",
    "train_ready_src",
    "train_passed"
], {table: {table: "timetablerows", schema: "public"}});

exports.processMessage = function(json, callback) {
    prepareTrain(json, function(err, data) {
        if (err)
            return callback(err);

        upsert(data, function (err, results) {
            if (err)
                return callback(err);
            callback();
        });
    });
}

function prepareTrain(data, callback) {
    const timetablerows = [];
    const length = data.timeTableRows.length;
    let row_index = 0;
    let j = 0;

    // flatten arrival and departure rows into one row
    for (let i = 0; i <= length; i = i + 2) {
        // Coalesce cause codes into one column
        let arrCauseCode = null;
        let depCauseCode = null;
        if (i > 0 && Array.isArray(data.timeTableRows[i-1].causes)) {
            if (data.timeTableRows[i-1].causes.length > 0) {
                if (data.timeTableRows[i-1].causes[0].thirdCategoryCode) {
                    arrCauseCode = data.timeTableRows[i-1].causes[0].thirdCategoryCode;
                } else if (data.timeTableRows[i-1].causes[0].detailedCategoryCode) {
                    arrCauseCode = data.timeTableRows[i-1].causes[0].detailedCategoryCode;
                } else if (data.timeTableRows[i-1].causes[0].categoryCode) {
                    arrCauseCode = data.timeTableRows[i-1].causes[0].categoryCode;
                }
            }
        }
        if (i < length && Array.isArray(data.timeTableRows[i].causes)) {
            if (data.timeTableRows[i].causes.length > 0) {
                if (data.timeTableRows[i].causes[0].thirdCategoryCode) {
                    depCauseCode = data.timeTableRows[i].causes[0].thirdCategoryCode;
                } else if (data.timeTableRows[i].causes[0].detailedCategoryCode) {
                    depCauseCode = data.timeTableRows[i].causes[0].detailedCategoryCode;
                } else if (data.timeTableRows[i].causes[0].categoryCode) {
                    depCauseCode = data.timeTableRows[i].causes[0].categoryCode;
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

        const row = {
            departure_date: data.departureDate,
            train_number: data.trainNumber,
            row_index: row_index,
            train_stopping: data.timeTableRows[j].trainStopping,
            station: data.timeTableRows[j].stationShortCode,
            commercial_stop: data.timeTableRows[j].commercialStop,
            commercial_track: u.filterValue(data.timeTableRows[j].commercialTrack),
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
            train_ready_src: trainReadySrc,
            train_passed: trainPassed
        };

        timetablerows.push(row);

        row_index++;
    }

    const last = timetablerows.length - 1;

    const train = {
        departure_date: data.departureDate,
        train_number: data.trainNumber,
        train_type: data.trainType,
        commuter_line_id: u.filterValue(data.commuterLineID),
        operator_code: data.operatorShortCode,
        running_currently: data.runningCurrently,
        cancelled: data.cancelled,
        version: data.version,
        adhoc_timetable: (data.timetableType === "ADHOC") ? true : false,
        acceptance_date: data.timetableAcceptanceDate,
        begin_station: timetablerows[0].station,
        begin_time: timetablerows[0].dep_scheduled,
        end_station: timetablerows[last].station,
        end_time: timetablerows[last].arr_scheduled
    };

    callback(null, {train: train, timetablerows: timetablerows});
}

function upsert(data, callback) {
    p.db.task(t => {
        const queries = [];
        if (data.train.deleted) {
            queries.push(t.none("DELETE FROM trains WHERE departure_date = $1 AND train_number = $2", [data.train.departure_date, data.train.train_number]));
            queries.push(t.none("DELETE FROM timetablerows WHERE departure_date = $1 AND train_number = $2", [data.train.departure_date, data.train.train_number]));
        } else {
            const q1 = t.none(p.pgp.helpers.insert(data.train, cs_trains) +
                " ON CONFLICT(departure_date, train_number) DO UPDATE SET " +
                cs_trains.assignColumns({from: 'EXCLUDED', skip: ["departure_date", "train_number"]}));
            queries.push(q1);

            const q2 = t.none(p.pgp.helpers.insert(data.timetablerows, cs_timetablerows) +
                " ON CONFLICT(departure_date, train_number, row_index) DO UPDATE SET " +
                cs_timetablerows.assignColumns({from: 'EXCLUDED', skip: ["departure_date", "train_number", "row_index"]}));
            queries.push(q2);
        }
        return t.batch(queries);
    })
    .then(() => {
        return callback(null);
    })
    .catch(error => {
        return callback(error);
    });
}
