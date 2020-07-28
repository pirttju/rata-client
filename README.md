# rata-client
Client program for rata.digitraffic.fi. Stores trains and compositions into a local PostgreSQL database.

## Requirements

- PostgreSQL v10+
- TimescaleDB extension

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

node rata-client.js -poll

polls trains and compositions from digitraffic

or

node rata-client.js -c file

imports archived compositions from json file

or

node rata-client.js -t file

imports archived trains from json file
