const async = require("async");
const fs = require("fs");
const pollTrains = require("./pollTrains");
const train = require ("./consumers/train");

function main(callback) {
    // Check for json file given as command line parameter
    if (process.argv.length > 2) {
        handleFile(process.argv[2], function(err) {
            callback();
        });
    } else {
        // No parameter given - start polling /trains endpoint
        pollTrains.startPolling();
    }
}

/**
 * Handles a file
 */
function handleFile(fileName, callback) {
    fs.readFile(fileName, function(err, data) {
        if (err) {
            callback("Could not read file", fileName);
        } else {
            let data = null;

            try {
                data = JSON.parse(data);
            } catch (e) {
                callback("JSON parse failed");
            }

            async.eachSeries(data, function(item, next) {
                train.processMessage(item, function(err) {
                    if (err)
                        console.log(err);
                    next();
                });
            }, function(err) {
                callback(null);
            });
        }
    });
}

/**
 * Receives train data
 */
pollTrains.on("data", function(data) {
    async.eachSeries(data, function(item, next) {
        train.processMessage(item, function(err) {
            if (err)
                console.log(err);
            next();
        });
    }, function() {
        return;
    });
});

pollTrains.on("error", function(err) {
    console.log(err)
});

main(function(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        process.exit(0);
    }
});
