import * as fs from 'fs';
import * as path from 'path';

const globalConfigPath = path.join(__dirname, 'globalConfig.json');

module.exports = async function () {
  await globalThis.__MONGOD__.stop();

  fs.unlinkSync(globalConfigPath);
};
