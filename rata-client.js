const train = require("./consumers/train.js");
const composition = require("./consumers/composition.js");

train.start();
composition.start();
