# rata-client
Client program for rata.digitraffic.fi API. Stores trains and compositions into a local PostgreSQL database.

## Requirements

- NodeJS v14+
- PostgreSQL v10+

## Optional requirement

- PM2

## Install

Install node modules:
```
npm install
```

### Database setup

Create a PostgreSQL database.

Then create tables by running init.sql:
```
psql -d mydb -f init.sql
```

### Configuration

Open config.js and revise config.DIGITRAFFIC_USER custom header to match your own application.

Create .env file and put DB configuration there:
```
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
POSTGRES_DB=mydb
POSTGRES_USER=user
POSTGRES_PASSWORD=pass
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

## Run in the background using PM2

When you have installed PM2 run this in the main directory:
```
pm2 start
```

## Batch import example

Create a temp directory:
```
mkdir temp
cd temp
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
