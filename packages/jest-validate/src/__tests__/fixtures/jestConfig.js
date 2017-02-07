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

const chalk = require('chalk');
const os = require('os');
const path = require('path');
const NODE_MODULES = path.sep + 'node_modules' + path.sep;
const replacePathSepForRegex = (string: string) => {
  if (path.sep === '\\') {
    return string.replace(/(\/|\\(?!\.))/g, '\\\\');
  }
  return string;
};

const NODE_MODULES_REGEXP = replacePathSepForRegex(NODE_MODULES);

const defaultConfig = {
  automock: false,
  bail: false,
  browser: false,
  cacheDirectory: path.join(os.tmpdir(), 'jest'),
  clearMocks: false,
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  expand: false,
  globals: {},
  haste: {
    providesModuleNodeModules: [],
  },
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: [
    'js',
    'json',
    'jsx',
    'node',
  ],
  moduleNameMapper: {},
  modulePathIgnorePatterns: [],
  noStackTrace: false,
  notify: false,
  preset: null,
  resetMocks: false,
  resetModules: false,
  roots: ['<rootDir>'],
  snapshotSerializers: [],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$',
  testResultsProcessor: null,
  testURL: 'about:blank',
  timers: 'real',
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  useStderr: false,
  verbose: null,
  watch: false,
};

const validConfig = {
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
  roots: ['<rootDir>'],
  setupFiles: ['<rootDir>/setup.js'],
  setupTestFrameworkScriptFile: '<rootDir>/testSetupFile.js',
  silent: true,
  snapshotSerializers: ['my-serializer-module'],
  testEnvironment: 'jest-environment-jsdom',
  testNamePattern: 'test signature',
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
};

const format = (value: string) => require('pretty-format')(value, {min: true});

/* eslint-disable max-len */
const deprecatedConfig = {
  preprocessorIgnorePatterns: (config: Object) =>
  `  Option ${chalk.bold('preprocessorIgnorePatterns')} was replaced by ${chalk.bold('transformIgnorePatterns')}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transformIgnorePatterns"')}: ${chalk.bold(`${format(config.preprocessorIgnorePatterns)}`)}
  }

  Please update your configuration.`,

  scriptPreprocessor: (config: Object) =>
  `  Option ${chalk.bold('scriptPreprocessor')} was replaced by ${chalk.bold('transform')}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${chalk.bold('"transform"')}: ${chalk.bold(`{".*": ${format(config.scriptPreprocessor)}}`)}
  }

  Please update your configuration.`,
};
/* eslint-enable max-len */

module.exports = {
  defaultConfig,
  deprecatedConfig,
  validConfig,
};
