const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      "departure_date",
      "train_number",
      "version",
      "train_type",
      "commuter_line_id",
      "operator_code",
      "running_currently",
      "cancelled",
      "adhoc_timetable",
      "acceptance_date",
      "begin_station",
      "begin_time",
      "end_station",
      "end_time",
      {name: "last_modified", mod: "^", def: "current_timestamp"}
    ], {table: {table: "trains", schema: "public"}});
  }
}

class TrainsRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }

  async insert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert);
    return this.db.none(query);
  }

  async maxversion() {
    return this.db.one("select max(version) from trains");
  }

  async upsert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert) +
      " on conflict (departure_date, train_number) do update set " +
      cs.insert.assignColumns({from: 'excluded', skip: ["departure_date", "train_number"]});
    return this.db.none(query);
  }

  async delete(date, number) {
    return this.db.result("delete from trains where departure_date = $1 and train_number = $2", [date, +number], r => r.rowCount);
  }
}

module.exports = TrainsRepository;
