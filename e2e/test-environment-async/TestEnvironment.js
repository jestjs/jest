// Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.

'use strict';

const fs = require('fs');
const os = require('os');
const mkdirp = require('mkdirp');
const JSDOMEnvironment = require('jest-environment-jsdom').default;

const DIR = os.tmpdir() + '/jest-test-environment';

class TestEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
    this.context = context;
  }

  setup() {
    console.info('TestEnvironment.setup:', this.context.testPath);
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
