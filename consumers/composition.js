const {db} = require("../db");
const models = require("../models");
const needle = require("needle");

let timer = 0;
let isRunning = false;

async function parse(departureDate, trainNumber, i, version, c) {
  if (c.beginTimeTableRow === undefined || c.endTimeTableRow === undefined) {
    return null;
  }

  const row = {
    departure_date: departureDate,
    train_number: trainNumber,
    journey_section: i,
    version: version,
    begin_station: c.beginTimeTableRow.stationShortCode,
    begin_time: c.beginTimeTableRow.scheduledTime,
    end_station: c.endTimeTableRow.stationShortCode,
    end_time: c.endTimeTableRow.scheduledTime,
    locomotives: c.locomotives,
    wagons: c.wagons,
    total_length: c.totalLength,
    maximum_speed: c.maximumSpeed
  };

  return row;
}

async function processCompositions(t) {
  const train = {
    departure_date: t.departureDate,
    train_number: t.trainNumber,
    version: t.version
  };

  const journeySections = [];

  // process journey sections
  let i = 0;
  for (const row of t.journeySections) {
    const comp = await parse(t.departureDate, t.trainNumber, i, t.version, row);
    if (comp !== null) {
      journeySections.push(comp);
    }
    i++;
  }

  return {train, journeySections};
}

async function processResult(trains, version) {
  const data = {
    version: version,
    trains: [],
    journeySections: []
  };
  for (const train of trains) {
    if (train.version > data.version || data.version == null)
      data.version = train.version;
    const processed = await processCompositions(train);
    data.trains.push(processed.train);
    data.journeySections.push(...processed.journeySections);
  }

  return data;
}

function query(version = null) {
  const apiurl = "https://rata.digitraffic.fi/api/v1/compositions";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = { compressed: true, json: true };

  needle("get", apiurl + params, options)
  .then(response => {
    return processResult(response.body, version);
  })
  .then(data => {
    return Promise.all([models.upsertCompositions(data), data.version]);
  })
  .then(([data, nextVersion]) => {
    if (isRunning) {
      if (timer) {
        clearTimeout(timer)
        timer = 0;
      }
      timer = setTimeout(() => query(nextVersion), 60000);
    }
  })
  .catch(err => {
    console.log(err);
    if (isRunning) {
      if (timer) {
        clearTimeout(timer)
        timer = 0;
      }
      timer = setTimeout(() => query(version), 300000); // try again after five minutes
    }
  })
}

async function importFromJSON(data, upsert = false) {
  const res = await processResult(data, 0);
  if (upsert) {
    return Promise.all([models.upsertCompositions(res), res.version]);
  } else {
    return Promise.all([models.insertCompositions(res), res.version]);
  }
}

async function start() {
  const version = await db.compositions.getMaxVersion();
  isRunning = true;
  if (version.max) {
    query(version.max);
  } else {
    query();
  }
}

function stop() {
  isRunning = false;
  if (timer) {
    clearTimeout(timer);
    timer = 0;
  }
}

module.exports = { importFromJSON, start, stop };
