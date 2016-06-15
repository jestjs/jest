/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config} from '../../../../types/Config';

const constants = require('../constants');
const path = require('path');
const utils = require('jest-util');

const defaultConfig: Config = {
  automock: true,
  bail: false,
  cacheDirectory: path.resolve(__dirname, '../..', '.haste_cache'),
  colors: false,
  coverageCollector: require.resolve('../IstanbulCollector'),
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  globals: {},
  haste: {
    providesModuleNodeModules: [],
  },
  mocksPattern: '__mocks__',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleLoader: require.resolve('../Runtime/Runtime'),
  moduleNameMapper: {},
  modulePathIgnorePatterns: [],
  noHighlight: false,
  noStackTrace: false,
  testEnvData: {},
  testEnvironment: 'jest-environment-jsdom',
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [
    utils.replacePathSepForRegex(constants.NODE_MODULES),
  ],
  testRegex: '__tests__/.*\.js$',
  testReporter: require.resolve('../reporters/IstanbulTestReporter'),
  testURL: 'about:blank',
  useStderr: false,
  verbose: false,
};

module.exports = defaultConfig;
