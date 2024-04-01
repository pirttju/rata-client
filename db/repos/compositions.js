const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      "departure_date",
      "train_number",
      "composition_number",
      "version",
      "begin_station_short_code",
      "end_station_short_code",
      {name: "locomotives", mod: ":json"},
      {name: "wagons", mod: ":json"},
      "total_length",
      "maximum_speed",
      {name: "last_modified", mod: "^", def: "current_timestamp"}
    ], {table: {table: "composition", schema: "digitraffic"}});
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

  async getMaxVersion() {
    return this.db.one("select max(version) from digitraffic.composition");
  }

  async upsert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert) +
      " on conflict (departure_date, train_number, composition_number) do update set " +
      cs.insert.assignColumns({from: 'excluded', skip: ["departure_date", "train_number", "composition_number"]});
    return this.db.none(query);
  }

  async delete(date, number) {
    return this.db.result("delete from digitraffic.composition where departure_date = $1 and train_number = $2", [date, +number], r => r.rowCount);
  }

  async deleteOldVersions(date, number, version) {
    return this.db.result("delete from digitraffic.composition where departure_date = $1 and train_number = $2 and version < $3", [date, +number, +version], r => r.rowCount);
  }

  async deleteByDate(date) {
    return this.db.result("delete from digitraffic.composition where departure_date = $1", [date], r => r.rowCount);
  }
}

module.exports = CompositionsRepository;
