async function flatten(departureDate, trainNumber, i, version, arr, dep) {
  const c = {...arr, ...dep}; // common values

  const row = {
    departure_date: departureDate,
    train_number: trainNumber,
    row_index: i,
    version: version,
    station: c.stationShortCode,
    train_stopping: c.trainStopping,
    commercial_stop: c.commercialStop !== undefined ? c.commercialStop : false,
    commercial_track: c.commercialTrack ? c.commercialTrack : null,
    arr_scheduled: null,
    arr_actual: null,
    arr_diff: null,
    arr_is_estimate: null,
    arr_unknown_delay: null,
    arr_cancelled: null,
    arr_cause: null,
    dep_scheduled: null,
    dep_actual: null,
    dep_diff: null,
    dep_is_estimate: null,
    dep_unknown_delay: null,
    dep_cancelled: null,
    dep_cause: null,
    train_ready: null,
    train_ready_src: null
  };

  if (arr !== null) {
    row.arr_scheduled = arr.scheduledTime;
    row.arr_actual = arr.actualTime !== undefined ? arr.actualTime : (arr.liveEstimateTime ? arr.liveEstimateTime : null);
    row.arr_diff = arr.differenceInMinutes;
    row.arr_is_estimate = arr.actualTime !== undefined ? false : (arr.liveEstimateTime ? true : false);
    row.arr_unknown_delay = arr.unknownDelay !== undefined ? arr.unknownDelay : false;
    row.arr_cancelled = arr.cancelled;

    if (arr.causes.length > 0) {
      if (arr.causes[0].thirdCategoryCode) {
        row.arr_cause = arr.causes[0].thirdCategoryCode;
      } else if (arr.causes[0].detailedCategoryCode) {
        row.arr_cause = arr.causes[0].detailedCategoryCode;
      } else if (arr.causes[0].categoryCode) {
        row.arr_cause = arr.causes[0].categoryCode;
      }
    }
  }

  if (dep !== null) {
    row.dep_scheduled = dep.scheduledTime;
    row.dep_actual = dep.actualTime !== undefined ? dep.actualTime : (dep.liveEstimateTime ? dep.liveEstimateTime : null);
    row.dep_diff = dep.differenceInMinutes;
    row.dep_is_estimate = dep.actualTime !== undefined ? false : (dep.liveEstimateTime ? true : false);
    row.dep_unknown_delay = dep.unknownDelay !== undefined ? dep.unknownDelay : false;
    row.dep_cancelled = dep.cancelled;

    if (dep.causes.length > 0) {
      if (dep.causes[0].thirdCategoryCode) {
        row.dep_cause = dep.causes[0].thirdCategoryCode;
      } else if (dep.causes[0].detailedCategoryCode) {
        row.dep_cause = dep.causes[0].detailedCategoryCode;
      } else if (dep.causes[0].categoryCode) {
        row.dep_cause = dep.causes[0].categoryCode;
      }
    }
  }

  if (c.trainReady) {
    row.train_ready = c.trainReady.timestamp;
    row.train_ready_src = c.trainReady.source;
  }

  return row;
}

async function processTrain(t) {
  const train = {
    departure_date: t.departureDate,
    train_number: t.trainNumber,
    version: t.version,
    train_type: t.trainType,
    commuter_line_id: t.commuterLineID ? t.commuterLineID : null,
    operator_code: t.operatorShortCode,
    running_currently: t.runningCurrently,
    cancelled: t.cancelled,
    adhoc_timetable: t.timetableType !== "REGULAR" ? true : false,
    acceptance_date: t.timetableAcceptanceDate,
    begin_station: t.timeTableRows[0].stationShortCode,
    begin_time: t.timeTableRows[0].scheduledTime,
    end_station: null,
    end_time: null
  };
  
  const timetablerows = [];

  // process timetable rows
  let arrival = null;
  let i = 0;
  for (const row of t.timeTableRows) {
    if (row.type === "ARRIVAL") {
      arrival = row;
    } else if (row.type === "DEPARTURE") {
      train.timetable.push(await flatten(t.departureDate, t.trainNumber, i, t.version, arrival, row));
      i++;
    }
  }

  // last arrival (destination)
  train.timetable.push(await flatten(t.departureDate, t.trainNumber, i, t.version, arrival, null));

  train.end_station = arrival.stationShortCode;
  train.end_time = arrival.scheduledTime;

  return {train, timetablerows};
}

async function processResult(trains) {
  const data = {
    version: 0,
    trains: [],
    timetablerows: []
  };
  for (const train of trains) {
    if (train.version > data.version)
      data.version = train.version;
    const processed = await processTrain(train);
    data.trains.push(processed.train);
    data.timetablerows.push(processed.timetablerows);
  }

  return data;
}

module.exports = { processResult };
