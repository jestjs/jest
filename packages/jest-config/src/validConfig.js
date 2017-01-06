/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

import type {Config, DefaultConfig} from 'types/Config';

const constants = require('./constants');
const {replacePathSepForRegex} = require('jest-util');

const NODE_MODULES_REGEXP = replacePathSepForRegex(constants.NODE_MODULES);

module.exports = ({
  automock: false,
  bail: false,
  browser: false,
  cacheDirectory: '/tmp/user/jest',
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  expand: false,
  globals: {},
  haste: {
    providesModuleNodeModules: ['react', 'react-native'],
  },
  mocksPattern: '__mocks__',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  moduleNameMapper: {},
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  noStackTrace: false,
  notify: false,
  preset: 'react-native',
  resetMocks: false,
  resetModules: false,
  snapshotSerializers: ['my-serializer-module'],
  testEnvironment: 'jest-environment-jsdom',
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',
  testURL: 'about:blank',
  timers: 'real',
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  useStderr: false,
  verbose: false,
  watch: false,
  cache: true,
  collectCoverageFrom: ['src', '!public'],
  collectCoverageOnlyFrom: {
    "<rootDir>/this-directory-is-covered/covered.js": true,
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
    },
  },
  logHeapUsage: true,
  logTransformErrors: true,
  moduleLoader: '<rootDir>',
  moduleNameMapper: {
    '^React$': '<rootDir>/node_modules/react',
  },
  modulePaths: ['/shared/vendor/modules'],
  name: 'string',
  rootDir: '/',
  setupFiles: ['<rootDir>/setup.js'],
  setupTestFrameworkScriptFile: '<rootDir>/testSetupFile.js',
  silent: true,
  testNamePattern: 'test signature',
  // $FlowFixMe – transform is further normalized into Array<[string, string]>
  transform: {
    '^.+\\.js$': '<rootDir>/preprocessor.js'
  },
  unmockedModulePathPatterns: ['mock'],
  updateSnapshot: true,
  watchman: true,
  forceExit: false,
}: Config);
