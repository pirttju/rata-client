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

    if (data.journeySections && data.journeySections.length > 0) {
      queries.push(t.compositions.upsert(data.journeySections));
      for (const train of data.trains) {
        queries.push(t.compositions.deleteOldVersions(train.departure_date, train.train_number, train.version));
      }
    }

    return t.batch(queries);
  });
}

module.exports = {upsertTrains, upsertCompositions};
