async function parse(departureDate, trainNumber, i, version, c) {
  if (c.beginTimeTableRow === undefined || c.endTimeTableRow === undefined) {
    return null;
  }

  const row = {
    departure_date: departureDate,
    train_number: trainNumber,
    journey_section: i,
    version: version,
    begin_station: c.beginTimeTableRow.stationShortCode,
    begin_time: c.beginTimeTableRow.scheduledTime,
    end_station: c.endTimeTableRow.stationShortCode,
    end_time: c.endTimeTableRow.scheduledTime,
    locomotives: c.locomotives,
    wagons: c.wagons,
    total_length: c.totalLength,
    maximum_speed: c.maximumSpeed
  };

  return row;
}

async function processCompositions(t) {
  const train = {
    departure_date: t.departureDate,
    train_number: t.trainNumber,
    version: t.version
  };

  const journeySections = [];

  // process journey sections
  let i = 0;
  for (const row of t.journeySections) {
    const comp = await parse(t.departureDate, t.trainNumber, i, t.version, row);
    if (comp !== null) {
      journeySections.push(comp);
    }
    i++;
  }

  return {train, journeySections};
}

async function processResult(trains) {
  const data = {
    version: null,
    trains: [],
    journeySections: []
  };
  for (const train of trains) {
    if (train.version > data.version || data.version == null)
      data.version = train.version;
    const processed = await processCompositions(train);
    data.trains.push(processed.train);
    data.journeySections.push(...processed.journeySections);
  }

  return data;
}

module.exports = { processResult };
