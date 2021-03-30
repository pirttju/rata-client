const promise = require("bluebird");
const pgPromise = require("pg-promise");
const monitor = require("pg-monitor");
const dotenv = require("dotenv").config();
const {Compositions, Timetablerows, Trains} = require("./repos");

const config = {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const initOptions = {
  promiseLib: promise,
  extend(obj, dc) {
    obj.compositions = new Compositions(obj, pgp);
    obj.timetablerows = new Timetablerows(obj, pgp);
    obj.trains = new Trains(obj, pgp);
  }
};

const pgp = pgPromise(initOptions);
const db = pgp(config);

// Activate events monitor
// -development: all events
// -production: errors only
if (process.env.NODE_ENV === "development") {
  monitor.attach(initOptions);
} else {
  monitor.attach(initOptions, ["error"]);
}

module.exports = {db, pgp};
