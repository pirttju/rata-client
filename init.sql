CREATE SCHEMA IF NOT EXISTS digitraffic;

-- Trains
CREATE TABLE IF NOT EXISTS digitraffic.train (
    departure_date              date NOT NULL,
    train_number                int NOT NULL,
    operator_uic_code           smallint NOT NULL,
    train_type                  text NOT NULL,
    commuter_line_id            text,
    running_currently           boolean NOT NULL,
    cancelled                   boolean NOT NULL,
    version                     bigint NOT NULL,
    timetable_type              text NOT NULL,
    timetable_acceptance_date   timestamp with time zone NOT NULL,
    deleted                     boolean,
    PRIMARY KEY (departure_date, train_number)
);

-- Time Table Rows
CREATE TABLE IF NOT EXISTS digitraffic.time_table_row (
    departure_date              date NOT NULL,
    train_number                integer NOT NULL,
    row_number                  smallint NOT NULL,
    station_short_code          text NOT NULL,
    type                        text NOT NULL,
    train_stopping              boolean NOT NULL,
    commercial_stop             boolean,
    commercial_track            text,
    cancelled                   boolean NOT NULL,
    scheduled_time              timestamp with time zone NOT NULL,
    live_estimate_time          timestamp with time zone,
    unknown_delay               boolean,
    actual_time                 timestamp with time zone,
    difference_in_minutes       smallint,
    causes                      text,
    train_ready                 boolean,
    PRIMARY KEY (departure_date, train_number, row_number),
    FOREIGN KEY (departure_date, train_number) REFERENCES digitraffic.train (departure_date, train_number) ON DELETE CASCADE
);

CREATE INDEX ON digitraffic.time_table_row (station_short_code);
CREATE INDEX ON digitraffic.time_table_row (scheduled_time);

-- Compositions
CREATE TABLE IF NOT EXISTS digitraffic.composition (
    departure_date              date NOT NULL,
    train_number                integer NOT NULL,
    composition_number          smallint NOT NULL,
    begin_station_short_code    text NOT NULL,
    end_station_short_code      text NOT NULL,
    locomotives                 jsonb NOT NULL,
    wagons                      jsonb,
    total_length                smallint NOT NULL,
    maximum_speed               smallint NOT NULL,
    PRIMARY KEY (departure_date, train_number, composition_number),
    FOREIGN KEY (departure_date, train_number) REFERENCES digitraffic.train (departure_date, train_number) ON DELETE CASCADE
);
