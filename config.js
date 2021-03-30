const config = {};

// set custom application headers
// https://www.digitraffic.fi/ohjeita/#digitraffic-user--otsikko
config.DIGITRAFFIC_USER = "RataClient/2.2"; // change to your liking
config.USER_AGENT = "RataClient/2.2";

// do not actually delete trains flagged "deleted" if true
config.ignoreDeleted = false;

module.exports = config;
