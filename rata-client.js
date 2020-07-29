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
function fileImport(path, consumer) {
  const fileContents = fs.readFileSync(path, 'utf8');
  let data;

  try {
    data = JSON.parse(fileContents);
  } catch(err) {
    console.error(err);
    return false;
  }

  if (data && data.length > 0) {
    consumer.importFromJSON(data)
    .then(([res, version]) => {
      console.log(res.length + " trains upserted (" + version + ")");
      process.exit(0);
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

function main(argv) {
  // checks for command line arguments
  if (argv.c && fileExists(argv.c)) {
    fileImport(argv.c, composition);
  } else if (argv.t && fileExists(argv.t)) {
    fileImport(argv.t, train);
  } else if (argv.poll) {
    console.log("Start polling...");
    poll();
  } else {
    console.error("Usage: rata-client.js [options]");
    console.error("  options:");
    console.error("    -c file  import compositions from a file");
    console.error("    -t file  import trains from a file");
    console.error("    -poll    start polling");
  }
}

console.log(argv);
main(argv);
