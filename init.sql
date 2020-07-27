-- train data
CREATE TABLE trains (
    departure_date      date NOT NULL,
    train_number        int NOT NULL,
    version             bigint NOT NULL,
    train_type          text NOT NULL,
    commuter_line_id    text,
    operator_code       text,
    running_currently   boolean NOT NULL DEFAULT FALSE,
    cancelled           boolean NOT NULL DEFAULT FALSE,
    adhoc_timetable     boolean NOT NULL DEFAULT FALSE,
    acceptance_date     timestamptz NOT NULL,
    begin_station       text NOT NULL,
    begin_time          timestamptz NOT NULL,
    end_station         text NOT NULL,
    end_time            timestamptz NOT NULL,
    last_modified       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (departure_date, train_number)
);

SELECT create_hypertable('trains', 'departure_date');
-- volume 2000 rows per day: 370 kB on disk
-- 1 year = 132 MB
SELECT set_chunk_time_interval('trains', interval '1 year');


-- timetable data for trains
CREATE TABLE timetablerows (
    departure_date      date NOT NULL,
    train_number        int NOT NULL,
    row_index           smallint NOT NULL,
    version             bigint NOT NULL,
    station             text NOT NULL,
    train_stopping      boolean NOT NULL DEFAULT FALSE,
    commercial_stop     boolean NOT NULL DEFAULT FALSE,
    commercial_track    text,
    arr_scheduled       timestamptz,
    arr_actual          timestamptz,
    arr_diff            smallint,
    arr_is_estimate     boolean,
    arr_unknown_delay   boolean,
    arr_cancelled       boolean,
    arr_cause           text,
    dep_scheduled       timestamptz,
    dep_actual          timestamptz,
    dep_diff            smallint,
    dep_is_estimate     boolean,
    dep_unknown_delay   boolean,
    dep_cancelled       boolean,
    dep_cause           text,
    train_ready         timestamptz,
    train_ready_src     text,
    PRIMARY KEY (departure_date, train_number, row_index)
);

CREATE INDEX ON timetablerows (station);

SELECT create_hypertable('timetablerows', 'departure_date');
-- volume 40000 rows per day: 9.7 MB on disk
-- 4 months = 885 MB
SELECT set_chunk_time_interval('timetablerows', interval '4 months');


-- composition data for trains
CREATE TABLE compositions (
    departure_date      date NOT NULL,
    train_number        integer NOT NULL,
    journey_section     smallint NOT NULL,
    version             bigint NOT NULL,
    begin_station       text NOT NULL,
    begin_time          timestamptz NOT NULL,
    end_station         text NOT NULL,
    end_time            timestamptz NOT NULL,
    locomotives         jsonb,
    wagons              jsonb,
    total_length        smallint,
    maximum_speed       smallint,
    last_modified       timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (departure_date, train_number, journey_section)
);

SELECT create_hypertable('compositions', 'departure_date');
-- volume 1000 rows per day: 1 MB on disk
-- 1 year = 365 MB
SELECT set_chunk_time_interval('compositions', interval '1 year');
