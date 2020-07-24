const needle = require("needle");
const {db} = require("./db");
const train = require("./consumers/train.js");

function query(version = null) {
  const apiurl = "https://rata.digitraffic.fi/api/v1/trains";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = { compressed: true, json: true };

  needle("get", apiurl + params, options)
  .then(response => {
    return train.processResult(response.body);
  })
  .then(data => {
    // processed data
    console.log(data);
    setTimeout(() => query(data.version), 15000);
    return;
  })
  .catch(err => {
    // err
    console.log(err);
  })
}

query();
