const {readInitialOptions} = require('jest-config');
async function readConfig() {
  console.log(JSON.stringify(await readInitialOptions(process.argv[2])));
}
readConfig();
