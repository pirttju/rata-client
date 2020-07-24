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

  async insert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert);
    return this.db.none(query);
  }

  async upsert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert) +
      " on conflict (departure_date, train_number, row_index) do update set " +
      cs.insert.assignColumns({from: 'excluded', skip: ["departure_date", "train_number", "row_index"]});
    return this.db.none(query);
  }

  async delete(date, number) {
    return this.db.any("delete from timetablerows where departure_date = $1 and train_number = $2", [date, +number]);
  }

  async deleteOldVersions(date, number, version) {
    return this.db.any("delete from timetablerows where departure_date = $1 and train_number = $2 and version < $3", [date, +number, +version]);
  }

  async deleteByDate(date) {
    return this.db.any("delete from timetablerows where departure_date = $1", [date]);
  }
}

module.exports = TimetablerowsRepository;
