const dbConfig = require("../db-config.json");
const pgp = require("pg-promise");

const initOptions = {};
const pgp = pgPromise(initOptions);
const db = pgp(dbConfig);

module.exports = { pgp, db };
