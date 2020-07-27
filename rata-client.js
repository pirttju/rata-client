const needle = require("needle");
const {db} = require("./db");
const train = require("./consumers/train.js");
const models = require("./models");

function query(version = null) {
  console.log("version", version);
  return;
  const apiurl = "https://rata.digitraffic.fi/api/v1/trains";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = { compressed: true, json: true };

  needle("get", apiurl + params, options)
  .then(response => {
    return train.processResult(response.body);
  })
  .then(data => {
    // processed data
    models.upsertTrains(data);
    setTimeout(() => query(data.version), 15000);
    return;
  })
  .catch(err => {
    // err
    console.log(err);
  })
}

function start() {
  const version = train.getMaxVersion();
  query(version);
}

start();
