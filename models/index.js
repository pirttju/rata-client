const {db} = require("../db");
const config = require("../config");

function insertCompositions(data) {
  return db.tx("insert-compositions", t => {
    const queries = [];

    if (data.journeySections && data.journeySections.length > 0) {
      queries.push(t.compositions.insert(data.journeySections));
    }

    return t.batch(queries);
  });
}

function insertTrains(data) {
  return db.tx("insert-trains", t => {
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

    // delete train flagged as "deleted"
    if (!config.ignoreDeleted && data.deleted && data.deleted.length > 0) {
      for (const del of data.deleted) {
        queries.push(t.trains.delete(del.departure_date, del.train_number));
        queries.push(t.timetablerows.delete(del.departure_date, del.train_number));
      }
    }

    return t.batch(queries);
  });
}

module.exports = {insertCompositions, insertTrains, upsertCompositions, upsertTrains};
