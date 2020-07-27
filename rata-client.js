const needle = require("needle");
const {db} = require("./db");
const train = require("./consumers/train.js");
const composition = require("./consumers/composition.js");
const models = require("./models");

function trainQuery(version = null) {
  const apiurl = "https://rata.digitraffic.fi/api/v1/trains";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = { compressed: true, json: true };

  needle("get", apiurl + params, options)
  .then(response => {
    return train.processResult(response.body, version);
  })
  .then(data => {
    return Promise.all([models.upsertTrains(data), data.version]);
  })
  .then(([data, version]) => {
    console.log("trains version", version);
    setTimeout(() => trainQuery(version), 30000);
  })
  .catch(err => {
    console.log(err);
  })
}

function compositionQuery(version = null) {
  const apiurl = "https://rata.digitraffic.fi/api/v1/compositions";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = { compressed: true, json: true };

  needle("get", apiurl + params, options)
  .then(response => {
    return composition.processResult(response.body, version);
  })
  .then(data => {
    return Promise.all([models.upsertCompositions(data), data.version]);
  })
  .then(([data, version]) => {
    console.log("compositions version", version);
    setTimeout(() => compositionQuery(version), 30000);
  })
  .catch(err => {
    console.log(err);
  })
}

async function start() {
  const trainsVersion = await db.trains.getMaxVersion();
  if (trainsVersion.max) {
    trainQuery(trainsVersion.max);
  } else {
    trainQuery();
  }

  const compositionsVersion = await db.compositions.getMaxVersion();
  if (compositionsVersion.max) {
    compositionQuery(compositionsVersion.max);
  } else {
    compositionQuery();
  }
}

start();
