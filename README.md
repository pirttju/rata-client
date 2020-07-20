# rata-client
Client program for rata.digitraffic.fi.
Stores trains into PostgreSQL database. Requires TimescaleDB extension.

Create db-config.json:

{
  "host": "localhost",
  "port": 5432,
  "database": "db",
  "user": "usr",
  "password": "pass"
}


Usage

node rata-client.js

polls /trains endpoint continuously

or

node rata-client.js fileName

imports trains JSON dump from fileName
