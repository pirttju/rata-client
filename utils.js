const request = require("request");
const zlib = require("zlib");
var exports = module.exports = {};

/**
 * Filters INT value */
exports.filterInt = function(val) {
    if (/^(\-|\+)?([0-9]+)$/.test(val)) {
        return Number(val);
    }
    
    return null;
}

/**
 * Filters BOOL value */
exports.filterBoolean = function(val) {
    if (val === "undefined") {
        return null;
    } else if (val) {
        return true;
    } else {
        return false;
    }
}

/**
 * Filters any value */
exports.filterValue = function(val) {    
    if (val) return val;
    return null;
}

/**
 * Makes a HTTP GET request using gzip/deflate compression */
exports.requestWithEncoding = function(uri, callback) {
    var req = request.get({
        uri: uri,
        method: "GET",
        headers: {
            "user-agent": "rata-client/1.0",
            "accept-encoding": "gzip"
        }
    });

    req.on("response", function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var buffer = Buffer.concat(chunks);
            var encoding = res.headers["content-encoding"];

            if (encoding === "gzip") {
                zlib.gunzip(buffer, function (err, decoded) {
                    callback(err, decoded && decoded.toString());
                });
            } else if (encoding === "deflate") {
                zlib.inflate(buffer, function (err, decoded) {
                    callback(err, decoded && decoded.toString());
                });
            } else {
                callback(null, buffer.toString());
            }
        });
    });

    req.on("error", function (err) {
        callback(err);
    });
}
