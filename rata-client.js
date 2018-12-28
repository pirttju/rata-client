const async = require("async");
const fs = require("fs");
const moment = require("moment");
const mqtt = require("mqtt");
const train = require ("./consumers/train");
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
        // No parameter given - open MQTT connection
        listenRataMQTT();
    }
}

function handleFile(fileName, callback) {
    fs.readFile(fileName, function(err, data) {
        if (err) {
            callback("Could not read file!");
        } else {
            try {
                json = JSON.parse(data);
            } catch (e) {
                callback("JSON parse failed!");
            }

            async.eachSeries(json, function(item, next) {
                let fileType = "?";

                if (item.timeTableRows) {
                    fileType = "trains";
                }
    
                if (item.journeySections) {
                    fileType = "compositions";
                }

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

function listenRataMQTT() {
    const client = mqtt.connect("mqtt://rata-mqtt.digitraffic.fi");

    client.on("connect", function(connack) {
        if (connack && connack.sessionPresent) {
            console.log(moment().toISOString(), "MQTT: Connection restored.");
        } else {
            console.log(moment().toISOString(), "MQTT: Connected.");

            // Listen trains
            client.subscribe(["trains/#", "compositions/#"], function(err) {
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

        processMessage(topic, json, function() {
            // Done
        });
    });
}

function processMessage(topic, json, callback) {
    if (topic.startsWith("trains")) {
        train.processMessage(json, function(err) {
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
