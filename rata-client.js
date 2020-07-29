const fs = require("fs");
const argv = require("minimist")(process.argv.slice(2));
const train = require("./consumers/train.js");
const composition = require("./consumers/composition.js");

// starts polling
function poll() {
  train.start();
  composition.start();
}

// checks if file exists
function fileExists(path) {
  try {
    if (fs.existsSync(path)) {
      return true;
    }
  } catch(err) {
    console.error(err);
  }
  return false;
}

// parses json from a file and runs import
function fileImport(path, consumer, upsert = false) {
  const fileContents = fs.readFileSync(path, 'utf8');
  let data;

  try {
    data = JSON.parse(fileContents);
  } catch(err) {
    console.error(err);
    return false;
  }

  if (data && data.length > 0) {
    consumer.importFromJSON(data, upsert)
    .then(([res, version]) => {
      console.log("File imported (version " + version + ")");
      process.exit();
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
  } else {
    console.error("No data");
    return false;
  }
}

// checks for command line arguments
function main(argv) {
  let upsert = false;
  if (argv.u)
    upsert = true;
  if (argv.c && fileExists(argv.c)) {
    fileImport(argv.c, composition, upsert);
  } else if (argv.t && fileExists(argv.t)) {
    fileImport(argv.t, train, upsert);
  } else if (argv.p) {
    console.log("Start polling...");
    poll();
  } else {
    console.error("Usage: rata-client.js [options]");
    console.error("  options:");
    console.error("    -c file  import compositions from a file");
    console.error("    -t file  import trains from a file");
    console.error("    -u       upsert instead of insert when importing");
    console.error("    -p       start polling");
  }
}

main(argv);
