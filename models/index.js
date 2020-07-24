const {db} = require("../db");

function upsertTrains(data) {
  return db.tx("upsert-trains", t => {
    const queries = [];
    if (data.trains && data.trains.length > 0)
      queries.push(t.trains.upsert(data.trains));
    if (data.timetablerows && data.timetablerows.length > 0)
      queries.push(t.timetablerows.upsert(data.timetablerows));
    return t.batch(queries);
  });
}

module.exports = {upsertTrains};
