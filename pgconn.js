var options = {};
var pgp = require("pg-promise")(options);
var cn = "postgres://"; // Postgres connection string
var db = pgp(cn);

module.exports = {
    pgp, db
};
