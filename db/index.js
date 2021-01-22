const promise = require("bluebird");
const pgPromise = require("pg-promise");
const monitor = require("pg-monitor");
const configuration = require("../config.js");
const dbConfig = configuration.DB;
const {Compositions, Timetablerows, Trains} = require("./repos");

const initOptions = {
  promiseLib: promise,
  extend(obj, dc) {
    obj.compositions = new Compositions(obj, pgp);
    obj.timetablerows = new Timetablerows(obj, pgp);
    obj.trains = new Trains(obj, pgp);
  }
};

const pgp = pgPromise(initOptions);
const db = pgp(dbConfig);

if (process.env.NODE_ENV === "development") {
  monitor.attach(initOptions);
} else {
  monitor.attach(initOptions, ["error"]);
}

module.exports = {db, pgp};
