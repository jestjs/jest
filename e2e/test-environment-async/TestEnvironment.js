/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const JSDOMEnvironment = require('jest-environment-jsdom').TestEnvironment;
const {createDirectory} = require('jest-util');

const DIR = `${os.tmpdir()}/jest-test-environment`;

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
      createDirectory(DIR);
      fs.writeFileSync(`${DIR}/teardown`, 'teardown');
    });
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = TestEnvironment;
