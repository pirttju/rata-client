# rata-client
Client program for rata.digitraffic.fi.
Stores trains into PostgreSQL database.

## Requirements

Postgresql v10+
Timescaledb extension

## Install

Create a database and then create initial tables by running init.sql.

psql <db> -f init.sql

Create db-config.json:

{
  "host": "localhost",
  "port": 5432,
  "database": "db",
  "user": "usr",
  "password": "pass"
}

## Usage

node rata-client.js

polls /trains endpoint continuously

or

node rata-client.js fileName

imports trains JSON dump from fileName
