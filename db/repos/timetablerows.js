const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      "departure_date",
      "train_number",
      "row_index",
      "version",
      "station",
      "train_stopping",
      "commercial_stop",
      "commercial_track",
      "arr_scheduled",
      "arr_actual",
      "arr_diff",
      "arr_is_estimate",
      "arr_unknown_delay",
      "arr_cancelled",
      "arr_cause",
      "dep_scheduled",
      "dep_actual",
      "dep_diff",
      "dep_is_estimate",
      "dep_unknown_delay",
      "dep_cancelled",
      "dep_cause",
      "train_ready",
      "train_ready_src"
    ], {table: {table: "timetablerows", schema: "public"}});
  }
}

class TimetablerowsRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }
  
  async upsert(values) {
    return;
  }
  
  async delete(date, number) {
    return this.db.result("DELETE FROM timetablerows WHERE departure_date = $1 AND train_number = $2", [date, +number], r => r.rowCount);
  }
}

module.exports = TimetablerowsRepository;
