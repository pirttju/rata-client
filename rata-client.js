const fs = require("fs");
const mqtt = require("mqtt");
const moment = require("moment");
const train = require ("./consumers/train");
const composition = require("./consumers/composition");

global.rataMQTTDisconnected = false;

function main() {
    let parameter;

    if (process.argv.length > 2) {
        parameter = process.argv[2];
        regex = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
        if (parameter.match(regex) && moment(process.argv[2], "YYYY-MM-DD", true).isValid() ) {
            downloadTrainsByDate(parameter);
            downloadCompositionsByDate(parameter);
        } else if (fs.existsSync(parameter)) {
            loadTrainsFromFile(parameter);
            loadCompositionsFromFile(parameter);
        } else {
            console.error("Unknown parameter");
            process.exit(1);
        }
    } else {
        // No parameters given, start automatic updating
        listenRataMQTT();
    }
}

function downloadTrainsByDate(date) {
    // TODO
}

function downloadCompositionsByDate(date) {
    // TODO
}

function loadTrainsFromFile(fileName) {
    // TODO
}

function loadCompositionsFromFile(fileName) {
    // TODO
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
        if (topic.startsWith("trains")) {
            train.processMessage(message, function() {
                // Done
            });
        } else if (topic.startsWith("compositions")) {
            composition.processMessage(message, function() {
                // Done
            });
        } else {
            console.error(moment().toISOString(), "MQTT: Message from unknown topic:", topic);
        }
    });
}

main();
