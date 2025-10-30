const cs = {}; // Reusable ColumnSet objects

// Helper for creating static ColumnSet objects
function createColumnsets(pgp) {
  // A ColumnSet for inserting multiple vehicles
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet(
      [
        "composition_id",
        "location",
        "sales_number",
        "vehicle_number",
        "locomotive_type",
        "wagon_type",
      ],
      { table: { table: "vehicle", schema: "digitraffic" } }
    );
  }
}

class VehiclesRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp); // Initialize column sets
  }

  /**
   * Inserts multiple vehicles into the database.
   * @param {Array<object>} data - An array of vehicle objects to insert.
   */
  async insert(data) {
    const query = this.pgp.helpers.insert(data, cs.insert);
    return this.db.none(query);
  }
}

module.exports = VehiclesRepository;
