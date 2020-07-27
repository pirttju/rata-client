const needle = require("needle");
const {db} = require("./db");
const train = require("./consumers/train.js");
const models = require("./models");

function query(version = null) {
  const apiurl = "https://rata.digitraffic.fi/api/v1/trains";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = { compressed: true, json: true };

  needle("get", apiurl + params, options)
  .then(response => {
    return train.processResult(response.body);
  })
  .then(data => {
    return Promise.all([models.upsertTrains(data), data.version]);
  })
  .then(([data, version]) => {
    console.log("data", data);
    console.log("version", version);
    //setTimeout(() => query(data.version), 15000);
    return;
  })
  .catch(err => {
    // err
    console.log(err);
  })
}

async function start() {
  const version = await db.trains.getMaxVersion(); 
  if (version.max) {
    query(version.max);
  } else {
    console.error("Max version query failed.");
  }
}

start();
