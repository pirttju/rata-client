const moment = require("moment");
const p = require("../pgconn");
const u = require ("../utils");

// Reusable set of columns
const cs_trainLocations = new p.pgp.helpers.ColumnSet(["train_number", "departure_date", "description", "timestamp", "geom", "speed",
    "track_section", "data_source"], {table: {schema: "rata", table: "trainlocations"}});

// This is a Point
const point = (lat, lng, srid) => ({
    toPostgres: ()=> p.pgp.as.format('ST_SetSRID(ST_MakePoint($1, $2), $3)', [lat, lng, srid]),
    rawType: true
});

exports.processMessage = function(json, callback) {
    prepareTrainLocation(json, function(err, data) {
        if (err) return callback(err);

        upsert(data, function (err) {
            if (err) return callback(err);

            callback();
        });
    });
}

function prepareTrainLocation(data, callback) {
    const trainLocation = {
        train_number: u.filterInt(data.trainNumber),
        departure_date: u.filterValue(data.departureDate),
        description: u.filterInt(data.trainNumber).toString(),
        timestamp: u.filterValue(data.timestamp),
        geom: point(data.location.coordinates[0], data.location.coordinates[1], 4326),
        speed: u.filterInt(data.speed),
        track_section: null,
        data_source: "GPS"
    };
    
    callback(null, trainLocation);
}

function upsert(data, callback) {
    const sql = p.pgp.helpers.insert(data, cs_trainLocations) +
    " ON CONFLICT(train_number, departure_date) DO UPDATE SET " +
        cs_trainLocations.assignColumns({from: 'EXCLUDED', skip: ["train_number", "departure_date"]});

    p.db.none(sql)
    .then(data => {
        return callback(null);
    })
    .catch(error => {
        return callback(error);
    });
}

// Run every 10 minutes to delete old trains
function everyTenMinutes() {
    setTimeout(everyTenMinutes, 600000);
    deleteOldTrains(function(err) {
        // Done
    })
}

function deleteOldTrains(callback) {
    p.db.task(t => {
        const queries = [];
        queries.push(t.none("DELETE FROM rata.trainlocations WHERE timestamp < now() - INTERVAL '15 minutes'"));
        queries.push(t.none("VACUUM rata.trainlocations"));
        return t.batch(queries);
    })
    .then(() => {
        return callback(null);
    })
    .catch(error => {
        return callback(error);
    });
}

everyTenMinutes();
