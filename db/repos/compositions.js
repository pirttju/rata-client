const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      "departure_date",
      "train_number",
      "journey_section",
      "version",
      "begin_station",
      "begin_time",
      "end_station",
      "end_time",
      {name: "locomotives", mod: ":json"},
      {name: "wagons", mod: ":json"},
      "total_length",
      "maximum_speed",
      {name: "last_modified", mod: "^", def: "current_timestamp"}
    ], {table: {table: "compositions", schema: "public"}});
  }
}

class CompositionsRepository {
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
    return this.db.one("select max(version) from compositions");
  }

  async upsert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert) +
      " on conflict (departure_date, train_number, journey_section) do update set " +
      cs.insert.assignColumns({from: 'excluded', skip: ["departure_date", "train_number", "journey_section"]});
    return this.db.none(query);
  }

  async delete(date, number) {
    return this.db.result("delete from compositions where departure_date = $1 and train_number = $2", [date, +number], r => r.rowCount);
  }

  async deleteOldVersions(date, number, version) {
    return this.db.result("delete from compositions where departure_date = $1 and train_number = $2 and version < $3", [date, +number, +version], r => r.rowCount);
  }

  async deleteByDate(date) {
    return this.db.result("delete from compositions where departure_date = $1", [date], r => r.rowCount);
  }
}

module.exports = CompositionsRepository;
