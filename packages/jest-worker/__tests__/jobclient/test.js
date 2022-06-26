/*
based on
rollup-plugin-terser/rollup-plugin-terser.js
in
qtwebengine-everywhere-src-6.3.1/src/3rdparty/chromium/third_party/devtools-frontend/src/node_modules/
*/

//const Worker = require("jest-worker").default;
const Worker = require("../../build/index.js").Worker;

(async () => {

const userOptions = {};

//userOptions.numWorkers = 1; // debug. no parallel
//userOptions.numWorkers = 2;

const worker = new Worker(require.resolve("./worker.js"), {
  numWorkers: userOptions.numWorkers,
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log('start jobs');
var a = worker.transform("a");
var b = worker.transform("b");
var c = worker.transform("c");
var d = worker.transform("d");

console.log('');
console.log('await jobs ...');
await Promise.all([a, b, c, d]);

console.log('stop workers');
worker.end();

console.log('done');

})();
