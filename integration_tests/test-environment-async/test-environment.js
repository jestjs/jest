'use strict';

const fs = require('fs');
const os = require('os');
const mkdirp = require('mkdirp');
const JSDOMEnvironment = require('jest-environment-jsdom');

const DIR = os.tmpdir() + '/jest';

class TestEnvironment extends JSDOMEnvironment {
  constructor(config) {
    super(config);
  }

  setup() {
    return super.setup().then(() => {
      this.global.setup = 'setup';
    });
  }

  teardown() {
    return super.teardown().then(() => {
      mkdirp.sync(DIR);
      fs.writeFileSync(DIR + '/teardown', 'teardown');
    });
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = TestEnvironment;
