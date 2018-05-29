/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = config => {
  config.set({
    browsers: ['ChromeHeadless'],
    files: ['e2e/browser-support/browser-test.js'],
    frameworks: ['mocha', 'browserify'],
    preprocessors: {
      'e2e/browser-support/browser-test.js': ['browserify'],
    },
  });
};
