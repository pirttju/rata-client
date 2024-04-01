const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      "departure_date",
      "train_number",
      "row_number",
      "version",
      "station_short_code",
      "type",
      "train_stopping",
      "commercial_stop",
      "commercial_track",
      "cancelled",
      "scheduled_time",
      "live_estimate_time",
      "unknown_delay",
      "actual_time",
      "difference_in_minutes",
      "causes",
      "train_ready",
    ], {table: {table: "time_table_row", schema: "digitraffic"}});
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
      " on conflict (departure_date, train_number, row_number) do update set " +
      cs.insert.assignColumns({from: 'excluded', skip: ["departure_date", "train_number", "row_number"]});
    return this.db.none(query);
  }

  async delete(date, number) {
    return this.db.result("delete from digitraffic.time_table_row where departure_date = $1 and train_number = $2", [date, +number], r => r.rowCount);
  }

  async deleteOldVersions(date, number, version) {
    return this.db.result("delete from digitraffic.time_table_row where departure_date = $1 and train_number = $2 and version < $3", [date, +number, +version], r => r.rowCount);
  }

  async deleteByDate(date) {
    return this.db.result("delete from digitraffic.time_table_row where departure_date = $1", [date], r => r.rowCount);
  }
}

module.exports = TimetablerowsRepository;
