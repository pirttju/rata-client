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

// parses json from a file and runs import
async function import(file, consumer) {
  const fileContents = fs.readFileSync(file, 'utf8');

  try {
    const data = JSON.parse(fileContents);
  } catch(err) {
    console.error(err);
    return false;
  }

  if (data && data.length > 0) {
    const result = await consumer.processResult(data);
    console.log(result);
  } else {
    console.error("No data");
    return false;
  }
}

// checks for command line arguments
if (argv.c && fileExists(argv.c)) {
  import(argv.c, composition);
} else if (argv.t && fileExists(argv.t)) {
  import(argv.t, train);
} else if (argv.poll) {
  poll();
} else {
  console.error("Usage: rata-client.js [options]");
  console.error("  options:");
  console.error("    -c file  import compositions from json");
  console.error("    -t file  import trains from json");
  console.error("    -poll    start polling");
}
