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
      {name: "last_modified", mod: "^", def: "CURRENT_TIMESTAMP"}
    ], {table: {table: "trains", schema: "public"}});
}

class TrainsRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }
  
  async upsert(values) {
    return;
  }
  
  async delete(date, number) {
    return this.db.result("DELETE FROM trains WHERE departure_date = $1 AND train_number = $2", [date, +number], r => r.rowCount);
  }
}

module.exports = TrainsRepository;
