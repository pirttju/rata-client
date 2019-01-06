const async = require("async");
const fs = require("fs");
const moment = require("moment");
const mqtt = require("mqtt");
const pollTrains = require("./pollTrains");
const train = require ("./consumers/train");
const trainlocation = require ("./consumers/trainlocation");
const composition = require("./consumers/composition");

let rataMQTTDisconnected = false;

function main(callback) {
    // Check for json file given as command line parameter
    if (process.argv.length > 2) {
        handleFile(process.argv[2], function(err) {
            // Done
            callback();
        });
    } else {
        // No parameter given - start polling trains and open MQTT connection
        pollTrains.startPolling();
        listenRataMQTT();
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
            let json = null;

            try {
                json = JSON.parse(data);
            } catch (e) {
                callback("JSON parse failed");
            }

            async.eachSeries(json, function(item, next) {
                let fileType = "?";
                if (item.timeTableRows) fileType = "trains";
                if (item.journeySections) fileType = "compositions";
                processMessage(fileType, item, function(err) {
                    if (err) console.log(moment().toISOString(), err);
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
        processMessage("trains", item, function(err) {
            if (err) console.log(moment().toISOString(), err);
            next();
        });
    }, function() {
        return;
    });
});

pollTrains.on("error", function(err) {
    console.log(moment().toISOString(), "error", err)
});

/**
 * Listens for data over MQTT
 */
function listenRataMQTT() {
    const client = mqtt.connect("mqtt://rata-mqtt.digitraffic.fi");

    client.on("connect", function(connack) {
        if (connack && connack.sessionPresent) {
            console.log(moment().toISOString(), "MQTT: Connection restored.");
        } else {
            console.log(moment().toISOString(), "MQTT: Connected.");

            // Listen compositions and train-locations
            client.subscribe(["compositions/#", "train-locations/#"], function(err) {
                if (!err) {
                    console.log(moment().toISOString(), "MQTT: Subscribed.");
                    rataMQTTDisconnected = false;
                } else {
                    console.error(moment().toISOString(), "MQTT: Subscription failed.");
                    rataMQTTDisconnected = true;
                }
            });
        }
    });

    client.on("reconnect", function() {
        console.log(moment().toISOString(), "MQTT: Reconnecting...");
    });

    client.on("close",  function() {
        console.error(moment().toISOString(), "MQTT: Connection closed.");
        rataMQTTDisconnected = true;
    });

    client.on("error",  function(err) {
        console.error(moment().toISOString(), "MQTT: Error", err);
    });

    client.on("message", function(topic, message) {
        try {
            json = JSON.parse(message);
        } catch (e) {
            console.log(moment().toISOString(), "JSON parse failed");
        }

        processMessage(topic, json, function(err) {
            if (err) console.log(moment().toISOString(), topic, err);
        });
    });
}

function processMessage(topic, json, callback) {
    if (topic.startsWith("trains")) {
        train.processMessage(json, function(err) {
            callback(err);
        });
    } else if (topic.startsWith("train-locations")) {
        trainlocation.processMessage(json, function(err) {
            callback(err);
        });
    } else if (topic.startsWith("compositions")) {
        composition.processMessage(json, function(err) {
            callback(err);
        });
    }
}

main(function(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        process.exit(0);
    }
});
