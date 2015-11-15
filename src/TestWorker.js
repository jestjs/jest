/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// Make sure uncaught errors are logged before we exit.
// Could be transient errors to do with loading and serializing the resouce
// map.
process.on('uncaughtException', (err) => {
  console.error(err.stack);
  process.exit(1);
});

const TestRunner = require('./TestRunner');

let testRunner;

module.exports = function testWorker(data, callback) {
  if (!testRunner) {
    testRunner = new TestRunner(data.config, {
      useCachedModuleLoaderResourceMap: true,
    });

    // Start require()ing config dependencies now.
    //
    // Config dependencies are entries in the config that are require()d (in
    // order to be pluggable) such as 'moduleLoader' or
    // 'testEnvironment'.
    testRunner.preloadConfigDependencies();

    // Start deserializing the resource map to get a potential head-start on
    // that work before the first "run-test" message comes in.
    //
    // This is just a perf optimization -- and it is only an optimization
    // some of the time (when the there is any significant idle time between
    // this first initialization message and the first "run-rest" message).
    //
    // It is also only an optimization so long as deserialization of the
    // resource map is a bottleneck (which is the case at the time of this
    // writing).
    testRunner.preloadResourceMap();
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
