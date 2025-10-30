const cs = {}; // Reusable ColumnSet objects

function createColumnsets(pgp) {
  if (!cs.insert) {
    cs.insert = new pgp.helpers.ColumnSet(
      [
        "departure_date",
        "train_number",
        "composition_number",
        "version",
        "begin_station_short_code",
        "end_station_short_code",
        "begin_scheduled_time",
        "end_scheduled_time",
        "total_length",
        "maximum_speed",
      ],
      { table: { table: "composition", schema: "digitraffic" } }
    );
  }
}

class CompositionsRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
    createColumnsets(pgp);
  }

  async upsertWithVehicles(trainData) {
    return this.db.tx("upsert-train", async (t) => {
      await t.compositions.delete(
        trainData.departureDate,
        trainData.trainNumber
      );

      if (!trainData.journeySections) {
        return;
      }

      for (const [index, section] of trainData.journeySections.entries()) {
        if (!section.beginTimeTableRow || !section.endTimeTableRow) {
          continue;
        }

        const compositionData = {
          departure_date: trainData.departureDate,
          train_number: trainData.trainNumber,
          composition_number: index + 1,
          version: trainData.version,
          begin_station_short_code: section.beginTimeTableRow.stationShortCode,
          end_station_short_code: section.endTimeTableRow.stationShortCode,
          begin_scheduled_time: section.beginTimeTableRow.scheduledTime,
          end_scheduled_time: section.endTimeTableRow.scheduledTime,
          total_length: section.totalLength,
          maximum_speed: section.maximumSpeed,
        };

        const { id: compositionId } = await t.one(
          this.pgp.helpers.insert(compositionData, cs.insert) + " RETURNING id"
        );

        // FIX: Use a Map to de-duplicate vehicles by location
        const vehicleMap = new Map();

        // 1. Process wagons first
        if (section.wagons) {
          section.wagons.forEach((wagon) => {
            vehicleMap.set(wagon.location, {
              composition_id: compositionId,
              location: wagon.location,
              sales_number: wagon.salesNumber
                ? String(wagon.salesNumber)
                : null,
              wagon_type: wagon.wagonType,
              vehicle_number: wagon.vehicleNumber,
              locomotive_type: null, // Set default
            });
          });
        }

        // 2. Process locomotives, merging data if location already exists
        if (section.locomotives) {
          section.locomotives.forEach((loco) => {
            if (vehicleMap.has(loco.location)) {
              // A wagon at this location already exists, so update it
              const existingVehicle = vehicleMap.get(loco.location);
              existingVehicle.locomotive_type = loco.locomotiveType;
              if (!existingVehicle.vehicle_number) {
                existingVehicle.vehicle_number = loco.vehicleNumber;
              }
            } else {
              // No wagon at this location, so add a new locomotive entry
              vehicleMap.set(loco.location, {
                composition_id: compositionId,
                location: loco.location,
                locomotive_type: loco.locomotiveType,
                vehicle_number: loco.vehicleNumber,
                sales_number: null,
                wagon_type: null,
              });
            }
          });
        }

        // 3. Convert the map values to an array for insertion
        const vehicles = Array.from(vehicleMap.values());

        if (vehicles.length > 0) {
          await t.vehicles.insert(vehicles);
        }
      }
    });
  }

  async getMaxVersion() {
    return this.db.oneOrNone(
      "SELECT max(version) FROM digitraffic.composition",
      [],
      (r) => r && r.max
    );
  }

  async delete(date, number) {
    return this.db.result(
      "DELETE FROM digitraffic.composition WHERE departure_date = $1 AND train_number = $2",
      [date, +number],
      (r) => r.rowCount
    );
  }
}

module.exports = CompositionsRepository;
