const cs = {};

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet([
      "departure_date",
      "train_number",
      "operator_uic_code",
      "train_type",
      "commuter_line_id",
      "running_currently",
      "cancelled",
      "version",
      "timetable_type",
      "timetable_acceptance_date",
      "deleted",
      {name: "last_modified", mod: "^", def: "current_timestamp"}
    ], {table: {table: "train", schema: "digitraffic"}});
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

  async getMaxVersion() {
    return this.db.one("select max(version) from digitraffic.train");
  }

  async upsert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert) +
      " on conflict (departure_date, train_number) do update set " +
      cs.insert.assignColumns({from: 'excluded', skip: ["departure_date", "train_number"]});
    return this.db.none(query);
  }

  async delete(date, number) {
    return this.db.result("delete from digitraffic.train where departure_date = $1 and train_number = $2", [date, +number], r => r.rowCount);
  }

  async deleteByDate(date) {
    return this.db.result("delete from digitraffic.train where departure_date = $1", [date], r => r.rowCount);
  }
}

module.exports = TrainsRepository;
