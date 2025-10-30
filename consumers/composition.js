const { db } = require("../db");
const models = require("../models");
const needle = require("needle");
const config = require("../config");

let timer = 0;
let isRunning = false;

async function processTrain(trainData) {
  // This function now processes a single train's data
  // and prepares it for the upsert operation.
  return models.upsertComposition(trainData);
}

async function processResult(trains) {
  const promises = [];
  let latestVersion = 0;

  for (const train of trains) {
    if (train.version > latestVersion) {
      latestVersion = train.version;
    }
    promises.push(processTrain(train));
  }

  await Promise.all(promises);
  return latestVersion;
}

function query(version = null) {
  const apiurl = "https://rata.digitraffic.fi/api/v1/compositions";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = {
    compressed: true,
    json: true,
    headers: {
      "Digitraffic-User": config.DIGITRAFFIC_USER,
      "User-Agent": config.USER_AGENT,
    },
  };

  needle("get", apiurl + params, options)
    .then((response) => {
      if (!response.body || response.body.length === 0) {
        return version; // No new data
      }
      return processResult(response.body);
    })
    .then((nextVersion) => {
      if (isRunning) {
        if (timer) {
          clearTimeout(timer);
        }
        // Use the latest version from the processed data for the next query
        timer = setTimeout(() => query(nextVersion), 60000);
      }
    })
    .catch((err) => {
      console.error("Error fetching or processing composition data:", err);
      if (isRunning) {
        if (timer) {
          clearTimeout(timer);
        }
        // Retry with the same version after five minutes on error
        timer = setTimeout(() => query(version), 300000);
      }
    });
}

async function importFromJSON(data) {
  // The upsert logic is handled by `upsertWithVehicles`
  const versions = data.map((train) => train.version);
  const latestVersion = Math.max(...versions, 0);
  await processResult(data);
  return [null, latestVersion];
}

async function start() {
  const maxVersionResult = await db.compositions.getMaxVersion();
  isRunning = true;
  // The result from getMaxVersion can be null if the table is empty
  const startVersion = maxVersionResult ? maxVersionResult : null;
  query(startVersion);
}

function stop() {
  isRunning = false;
  if (timer) {
    clearTimeout(timer);
    timer = 0;
  }
}

module.exports = { importFromJSON, start, stop };
