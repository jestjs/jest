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

import type {InitialConfig} from 'types/Config';

const constants = require('./constants');
const {replacePathSepForRegex} = require('jest-util');

const NODE_MODULES_REGEXP = replacePathSepForRegex(constants.NODE_MODULES);

module.exports = ({
  automock: false,
  bail: false,
  browser: false,
  cache: true,
  cacheDirectory: '/tmp/user/jest',
  clearMocks: false,
  collectCoverage: true,
  collectCoverageFrom: ['src', '!public'],
  collectCoverageOnlyFrom: {
    '<rootDir>/this-directory-is-covered/covered.js': true,
  },
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 50,
    },
  },
  expand: false,
  forceExit: false,
  globals: {},
  haste: {
    providesModuleNodeModules: ['react', 'react-native'],
  },
  logHeapUsage: true,
  logTransformErrors: true,
  mocksPattern: '__mocks__',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  moduleLoader: '<rootDir>',
  moduleNameMapper: {
    '^React$': '<rootDir>/node_modules/react',
  },
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  modulePaths: ['/shared/vendor/modules'],
  name: 'string',
  noStackTrace: false,
  notify: false,
  preset: 'react-native',
  resetMocks: false,
  resetModules: false,
  rootDir: '/',
  setupFiles: ['<rootDir>/setup.js'],
  setupTestFrameworkScriptFile: '<rootDir>/testSetupFile.js',
  silent: true,
  snapshotSerializers: ['my-serializer-module'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)(spec|test).js?(x)'],
  testNamePattern: 'test signature',
  testPathDirs: ['<rootDir>'],
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',
  testResultsProcessor: 'processor-node-module',
  testRunner: 'jasmine2',
  testURL: 'about:blank',
  timers: 'real',
  transform: {
    '^.+\\.js$': '<rootDir>/preprocessor.js',
  },
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  unmockedModulePathPatterns: ['mock'],
  updateSnapshot: true,
  useStderr: false,
  verbose: false,
  watch: false,
  watchman: true,
}: InitialConfig);
