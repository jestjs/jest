/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports = config => {
  config.set({
    browsers: ['ChromeHeadless'],
    files: [
      'integration_tests/browser-support/browser-test.js',
    ],
    frameworks: ['mocha', 'browserify'],
    plugins: ['karma-browserify', 'karma-chrome-launcher', 'karma-mocha'],
    preprocessors: {
      'integration_tests/browser-support/browser-test.js': ['browserify'],
    },
  });
};
