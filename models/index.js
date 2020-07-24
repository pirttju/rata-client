const {db} = require("../db");

function upsertTrains(data) {
  return db.tx("upsert-trains", t => {
    return t.batch([
      t.trains.upsert(data.trains),
      t.timetablerows.upsert(data.timetablerows)
    ]);
  }
}

module.exports = {upsertTrains};
