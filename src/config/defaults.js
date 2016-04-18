/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const constants = require('../constants');
const path = require('path');
const utils = require('jest-util');

module.exports = {
  automock: true,
  bail: false,
  cacheDirectory: path.resolve(__dirname, '..', '..', '.haste_cache'),
  coverageCollector: require.resolve('../IstanbulCollector'),
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  globals: {},
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleLoader: require.resolve('../Runtime/Runtime'),
  haste: {
    providesModuleNodeModules: [],
  },
  modulePathIgnorePatterns: [],
  moduleNameMapper: [],
  testDirectoryName: '__tests__',
  mocksPattern: '__mocks__',
  testEnvironment: 'jest-environment-jsdom',
  testEnvData: {},
  testFileExtensions: ['js'],
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [
    utils.replacePathSepForRegex(constants.NODE_MODULES),
  ],
  testReporter: require.resolve('../reporters/IstanbulTestReporter'),
  testURL: 'about:blank',
  noHighlight: false,
  colors: false,
  noStackTrace: false,
  verbose: false,
  useStderr: false,
};
