const { db } = require("../db");
const config = require("../config");

/*
 * @param {object} trainData - The raw JSON data for a single train's composition.
 */
function upsertComposition(trainData) {
  return db.compositions.upsertWithVehicles(trainData);
}

function insertTrains(data) {
  return db.tx("insert-trains", (t) => {
    const queries = [];

    if (data.timetablerows && data.timetablerows.length > 0) {
      queries.push(t.timetablerows.insert(data.timetablerows));
    }

    if (data.trains && data.trains.length > 0) {
      queries.push(t.trains.insert(data.trains));
    }

    return t.batch(queries);
  });
}

function upsertTrains(data) {
  return db.tx("upsert-trains", (t) => {
    const queries = [];

    if (data.timetablerows && data.timetablerows.length > 0) {
      queries.push(t.timetablerows.upsert(data.timetablerows));
    }

    if (data.trains && data.trains.length > 0) {
      queries.push(t.trains.upsert(data.trains));
      for (const train of data.trains) {
        queries.push(
          t.timetablerows.deleteOldVersions(
            train.departure_date,
            train.train_number,
            train.version
          )
        );
      }
    }

    // delete train flagged as "deleted"
    if (!config.ignoreDeleted && data.deleted && data.deleted.length > 0) {
      for (const del of data.deleted) {
        queries.push(t.trains.delete(del.departure_date, del.train_number));
        queries.push(
          t.timetablerows.delete(del.departure_date, del.train_number)
        );
      }
    }

    return t.batch(queries);
  });
}

module.exports = {
  upsertComposition,
  insertTrains,
  upsertTrains,
};
