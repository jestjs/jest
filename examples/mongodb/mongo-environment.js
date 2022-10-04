import * as fs from 'fs';
import * as path from 'path';
import {TestEnvironment} from 'jest-environment-node';

const globalConfigPath = path.join(__dirname, 'globalConfig.json');

class MongoEnvironment extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    console.log('Setup MongoDB Test Environment');

    const globalConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf-8'));

    this.global.__MONGO_URI__ = globalConfig.mongoUri;
    this.global.__MONGO_DB_NAME__ = globalConfig.mongoDBName;

    await super.setup();
  }

  async teardown() {
    console.log('Teardown MongoDB Test Environment');

    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = MongoEnvironment;
