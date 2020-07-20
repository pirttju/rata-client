const promise = require("bluebird");
const pgPromise = require("pg-promise");
const dbConfig = require("../../db-config.json");
const {Trains, Timetablerows} = require("./repos");

const initOptions = {
  promiseLib: promise,
  extend(obj, dc) {
    obj.trains = new Trains(obj, pgp);
    obj.timetablerows = new Timetablerows(obj, pgp);
  }
};

const pgp = pgPromise(initOptions);
const db = pgp(dbConfig);

module.exports = {db, pgp};
