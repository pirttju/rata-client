const async = require("async");
const EventEmitter = require("events");
const p = require("./pgconn");
const u = require("./utils");

let pollTrains = new EventEmitter();
module.exports = pollTrains;

let maxVersion = 0; // increasing version number of /trains?version endpoint
let nextQuery = null;
let running = false;

module.exports.startPolling = function() {
    if (!running) {
        p.db.any("SELECT MAX(version) AS maxversion FROM rata.trains")
        .then(data => {
            maxVersion = Number(data[0].maxversion);
            running = true;
            return query();
        })
        .catch(error => {
            return pollTrains.emit("error", "Could not query maxVersion");
        })
    }
}

module.exports.stopPolling = function() {
    if (running) {
        if (nextQuery) {
            clearTimeout(nextQuery);
            nextQuery = null;
        }

        running = false;
    }
}

function query() {
    if (nextQuery) {
        clearTimeout(nextQuery);
        nextQuery = null;
    }

    const uri = "https://rata.digitraffic.fi/api/v1/trains?version=" + maxVersion;

    u.requestWithEncoding(uri, function (err, result) {
        if (err) {
            // retry 60 seconds later
            nextQuery = setTimeout(query, 60000);
            return pollTrains.emit("error", err);
        }

        let data = null;

        try {
            data = JSON.parse(result);
        } catch (error) {
            // retry 60 seconds later
            nextQuery = setTimeout(query, 60000);
            return pollTrains.emit("error", "JSON parse failed");
        }

        if (data.errorMessage) {
            // retry 60 seconds later
            nextQuery = setTimeout(query, 60000);
            return pollTrains.emit("apierror", data.errorMessage);
        }

        const length = Object.keys(data).length;

        if (length > 0) {
            async.eachSeries(data, function(item, next) {
                if (item.version && Number(item.version) > maxVersion) maxVersion = Number(item.version); // track the version!
                next();
            }, function() {
                // send data out for processing
                pollTrains.emit("maxversion", maxVersion);
                pollTrains.emit("data", data);
                // call next query 20 seconds later
                nextQuery = setTimeout(query, 20000);
            })
        } else {
            // empty result (nothing to process)
            // call next query 20 seconds later
            nextQuery = setTimeout(query, 20000);
        }
    });
}