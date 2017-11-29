/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const jasmineReporters = require('jasmine-reporters');

module.exports = function(global) {
  const {jasmine} = global;

  if (jasmine) {
    // Some of the `jest-runtime` tests are very slow and cause timeouts on
    // Travis CI.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 70000;

    // Running on AppVeyor, add the custom reporter.
    if (process.env.APPVEYOR_API_URL) {
      jasmine.getEnv().addReporter(new jasmineReporters.AppVeyorReporter());
    }
  }
};
