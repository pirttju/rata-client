const {db} = require("../db");
const models = require("../models");
const needle = require("needle");
const config = require("../config");

let timer = 0;
let isRunning = false;

async function processTtr(departureDate, trainNumber, i, version, ttr) {
  const row = {
    departure_date: departureDate,
    train_number: trainNumber,
    row_number: i,
    version: version,
    station_short_code: ttr.stationShortCode,
    type: ttr.type,
    train_stopping: ttr.trainStopping ? true : false,
    commercial_stop: ttr.commercialStop ? true : false,
    commercial_track: ttr.commercialTrack ? ttr.commercialTrack : null,
    cancelled: ttr.cancelled ? true : false,
    scheduled_time: ttr.scheduledTime,
    live_estimate_time: ttr.liveEstimateTime ? ttr.liveEstimateTime : null,
    unknown_delay: ttr.unknownDelay ? true : null,
    actual_time: ttr.actualTime ? ttr.actualTime : null,
    difference_in_minutes: ttr.differenceInMinutes ? ttr.differenceInMinutes : null,
    causes: null,
    train_ready: null
  };

  if (ttr.causes.length > 0) {
    if (ttr.causes[0].thirdCategoryCode) {
      row.causes = ttr.causes[0].thirdCategoryCode;
    } else if (ttr.causes[0].detailedCategoryCode) {
      row.causes = ttr.causes[0].detailedCategoryCode;
    } else if (ttr.causes[0].categoryCode) {
      row.causes = ttr.causes[0].categoryCode;
    }
  }

  if (ttr.trainReady && ttr.trainReady.accepted) {
    row.train_ready = true;
  }

  return row;
}

async function processTrain(t) {
  const train = {
    departure_date: t.departureDate,
    train_number: t.trainNumber,
    operator_uic_code: t.operatorUICCode,
    train_type: t.trainType,
    commuter_line_id: t.commuterLineID ? t.commuterLineID : null,
    running_currently: t.runningCurrently,
    cancelled: t.cancelled,
    version: t.version,
    timetable_type: t.timetableType,
    timetable_acceptance_date: t.timetableAcceptanceDate,
    deleted: t.deleted ? t.deleted : null
  };
  
  const timetablerows = [];

  // process timetable rows
  let i = 0;
  for (const row of t.timeTableRows) {
    timetablerows.push(await processTtr(t.departureDate, t.trainNumber, i, t.version, row));
    i++;
  }

  return {train, timetablerows};
}

async function processResult(trains, version) {
  const data = {
    version: version,
    trains: [],
    timetablerows: [],
    deleted: []
  };
  for (const train of trains) {
    if (train.version > data.version || data.version == null)
      data.version = train.version;
    if (!config.ignoreDeleted && train.deleted) {
      data.deleted.push({
        departure_date: train.departureDate,
        train_number: train.trainNumber
      });
    } else {
      const processed = await processTrain(train);
      data.trains.push(processed.train);
      data.timetablerows.push(...processed.timetablerows);
    }
  }

  return data;
}

function query(version = null) {
  const apiurl = "https://rata.digitraffic.fi/api/v1/trains";
  const params = version !== null ? "?version=" + version.toString() : "";
  const options = { compressed: true, json: true, headers: { "Digitraffic-User": config.DIGITRAFFIC_USER, "User-Agent": config.USER_AGENT } };

  needle("get", apiurl + params, options)
  .then(response => {
    return processResult(response.body, version);
  })
  .then(data => {
    return Promise.all([models.upsertTrains(data), data.version]);
  })
  .then(([data, nextVersion]) => {
    if (isRunning) {
      if (timer) {
        clearTimeout(timer)
        timer = 0;
      }
      timer = setTimeout(() => query(nextVersion), 30000);
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
    return Promise.all([models.upsertTrains(res), res.version]);
  } else {
    return Promise.all([models.insertTrains(res), res.version]);
  }
}

async function start() {
  const version = await db.trains.getMaxVersion();
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
