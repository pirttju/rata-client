# rata-client
Client program for rata.digitraffic.fi. Stores trains and compositions into a local PostgreSQL database.

## Requirements

- PostgreSQL v10+
- TimescaleDB extension (used for automatic table partitioning)

## Install

Create a database and then create initial tables by running init.sql.
```
psql -d database -f init.sql
```

Open config.js and change config.DIGITRAFFIC_USER variable to your environment.

Create db-config.json (to a parent directory):
```
{
  "host": "localhost",
  "port": 5432,
  "database": "db",
  "user": "usr",
  "password": "pass"
}
```

## Usage
```
node rata-client.js -p
```
starts polling trains and compositions from digitraffic

or
```
node rata-client.js -c file
```
imports archived compositions from json file

or
```
node rata-client.js -t file
```
imports archived trains from json file

## Batch import example

Create a temp directory:
```
mkdir temp_trains
cd temp_trains
```
Create a list of urls to download from https://rata.digitraffic.fi/api/v1/trains/dumps/list.html and then download all files:
```
xargs -n 1 curl --compressed -O < url_list.txt
```
Unzip all files:
```
unzip '*.zip'
```
Process all trains json files in the directory:
```
for f in *trains.json; do echo $f; node ../rata-client/rata-client.js -t $f; done
```
