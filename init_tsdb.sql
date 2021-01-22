-- run when using timescaledb for partitioning

SELECT create_hypertable('trains', 'departure_date');
-- volume 2000 rows per day: 370 kB on disk
-- 1 year = 132 MB
SELECT set_chunk_time_interval('trains', interval '1 year');


SELECT create_hypertable('timetablerows', 'departure_date');
-- volume 40000 rows per day: 9.7 MB on disk
-- 4 months = 885 MB
SELECT set_chunk_time_interval('timetablerows', interval '4 months');

SELECT create_hypertable('compositions', 'departure_date');
-- volume 1000 rows per day: 1 MB on disk
-- 1 year = 365 MB
SELECT set_chunk_time_interval('compositions', interval '1 year');
