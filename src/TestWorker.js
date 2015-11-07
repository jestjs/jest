/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// Make sure uncaught errors are logged before we exit.
process.on('uncaughtException', err => {
  console.error(err.stack);
  process.exit(1);
});

const TestRunner = require('./TestRunner');

let testRunner;

module.exports = (data, callback) => {
  if (!testRunner) {
    testRunner = new TestRunner(data.config, {
      useCachedModuleLoaderResourceMap: true,
    });
  }

  try {
    testRunner.runTest(data.testFilePath)
      .then(
        result => callback(null, result),
        // TODO: move to error object passing (why limit to strings?).
        err => callback(err.stack || err.message || err)
      );
  } catch (err) {
    callback(err.stack || err.message || err);
  }
};
