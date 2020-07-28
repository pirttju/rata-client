const fs = require("fs");
const argv = require("minimist")(process.argv.slice(2));
const train = require("./consumers/train.js");
const composition = require("./consumers/composition.js");

// start polling
function poll() {
  train.start();
  composition.start();
}

function fileExists(file) {
  try {
    if (fs.existsSync(path)) {
      return true;
    }
  } catch(err) {
    console.error(err);
  }
  return false;
}

// import trains from a file
function importTrains(file) {
  // todo
}

// import compositions from a file
function importCompositions(file) {
  // todo
}

// parse command line arguments
if (argv.c) {
  if (fileExists(argv.c)
    importCompositions(argv.c);
} else if (argv.t) {
  if (fileExists(argv.t)
    importTrains(argv.t);
} else if (argv.poll) {
  poll();
} else {
  console.error("Usage: rata-client.js [options]");
  console.error("  options:");
  console.error("    -c file  import compositions from json");
  console.error("    -t file  import trains from json");
  console.error("    -poll    start polling");
}
