const {db} = require("../db");

function upsertTrains(data) {
  return db.tx("upsert-trains", t => {
    const queries = [];

    if (data.timetablerows && data.timetablerows.length > 0) {
      queries.push(t.timetablerows.upsert(data.timetablerows));
    }

    if (data.trains && data.trains.length > 0) {
      queries.push(t.trains.upsert(data.trains));
      for (const train of data.trains) {
        queries.push(t.timetablerows.deleteOldVersions(train.departure_date, train.train_number, train.version));
      }
    }

    return t.batch(queries);
  });
}

function upsertCompositions(data) {
  return db.tx("upsert-compositions", t => {
    const queries = [];

    if (data.compositions && data.compositions.length > 0) {
      queries.push(t.compositions.upsert(data.compositions));
      for (const train of data.trains) {
        queries.push(t.compositions.deleteOldVersions(train.departure_date, train.train_number, train.version));
      }
    }

    return t.batch(queries);
  });
}

function getMaxVersion() {
  return db.task("get-max-version", t => {
    return t.trains.getMaxVersion();
  }
}

module.exports = {upsertTrains, upsertCompositions, getMaxVersion};
