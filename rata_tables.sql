CREATE SCHEMA rata;

CREATE TYPE rata.train_type AS ENUM ('AE','H','HDM','HL','HLV','HSM','HV','IC','IC2','LIV','MUS','MUV','MV','P','PAI','PVS','PVV','PYO','S','SAA','T','TYO','V','VET','VEV','VLI','W');
CREATE TYPE rata.timetable_type AS ENUM ('REGULAR', 'ADHOC');

CREATE TABLE rata.trains (
    train_number        int,
    departure_date      date,
    operator_code       text,
    train_type          rata.train_type,
    commuter_line_id    text,
    running_currently   boolean,
    cancelled           boolean,
    version             bigint,
    timetable_type      rata.timetable_type,
    acceptance_date     timestamptz,
    deleted             boolean,
    last_modified       timestamptz,
    PRIMARY KEY (train_number, departure_date)
);

CREATE TYPE rata.row_type AS ENUM ('ARRIVAL', 'DEPARTURE');
CREATE TYPE rata.estimate_source_type AS ENUM ('COMBOCALC', 'LIIKE_AUTOMATIC', 'LIIKE_USER', 'MIKU_USER');
CREATE TYPE rata.train_ready_source_type AS ENUM ('KUPLA', 'LIIKE', 'PHONE');

CREATE TABLE rata.timetables (
    train_number        int,
    departure_date      date,
    row_key             smallint,
    train_stopping      boolean,
    station_code        text,
    row_type            rata.row_type,
    commercial_stop     boolean,
    commercial_track    text,
    cancelled           boolean,
    scheduled_time      timestamptz,
    estimate_source     rata.estimate_source_type,
    unknown_delay       boolean,
    actual_time         timestamptz,
    diff_in_minutes     smallint,
    actual_track        text,
    cause_code          text,
    train_ready         timestamptz,
    PRIMARY KEY (train_number, departure_date, row_key)
);

CREATE INDEX ON rata.timetables(station_code);
CREATE INDEX ON rata.timetables (DATE(scheduled_time AT TIME ZONE 'Europe/Helsinki'));
CREATE INDEX ON rata.timetables (DATE(actual_time AT TIME ZONE 'Europe/Helsinki'));

SELECT create_hypertable('rata.trains', 'departure_date');
SELECT create_hypertable('rata.timetables', 'departure_date');
