CREATE TABLE trains (
    departure_date      date NOT NULL,
    train_number        int NOT NULL,
    train_type          text NOT NULL,
    commuter_line_id    text,
    operator_code       text,
    running_currently   boolean NOT NULL DEFAULT FALSE,
    cancelled           boolean NOT NULL DEFAULT FALSE,
    version             bigint NOT NULL,
    adhoc_timetable     boolean NOT NULL DEFAULT FALSE,
    acceptance_date     timestamptz NOT NULL,
    begin_station       text NOT NULL,
    begin_time          timestamptz NOT NULL,
    end_station         text NOT NULL,
    end_time            timestamptz NOT NULL,
    last_modified       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (departure_date, train_number)
);

CREATE TABLE timetablerows (
    departure_date      date NOT NULL,
    train_number        int NOT NULL,
    row_index           smallint NOT NULL,
    station             text NOT NULL,
    train_stopping      boolean NOT NULL DEFAULT FALSE,
    commercial_stop     boolean NOT NULL DEFAULT FALSE,
    commercial_track    text,
    arr_scheduled       timestamptz,
    arr_live            timestamptz,
    arr_diff            smallint,
    arr_is_estimate     boolean,
    arr_unknown         boolean,
    arr_cancelled       boolean,
    arr_cause           text,
    dep_scheduled       timestamptz,
    dep_live            timestamptz,
    dep_diff            smallint,
    dep_is_estimate     boolean,
    dep_unknown         boolean,
    dep_cancelled       boolean,
    dep_cause           text,
    train_ready         timestamptz,
    train_ready_src     text,
    PRIMARY KEY (departure_date, train_number, row_index)
);

CREATE INDEX ON timetablerows (station);

-- create timescaledb tables
SELECT create_hypertable('trains', 'departure_date');
SELECT create_hypertable('timetablerows', 'departure_date');
SELECT set_chunk_time_interval('trains', interval '1 year');
SELECT set_chunk_time_interval('timetablerows', interval '3 months');
