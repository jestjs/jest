/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {tmpdir} from 'os';
import * as path from 'path';
import pc = require('picocolors');

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;
const replacePathSepForRegex = (string: string) => {
  if (path.sep === '\\') {
    return string.replaceAll(/(\/|\\(?!\.))/g, '\\\\');
  }
  return string;
};

const NODE_MODULES_REGEXP = replacePathSepForRegex(NODE_MODULES);

export const defaultConfig = {
  automock: false,
  bail: 0,
  cacheDirectory: path.join(tmpdir(), 'jest'),
  clearMocks: false,
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  expand: false,
  fakeTimers: {enableGlobally: false},
  globals: {},
  haste: {},
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  moduleNameMapper: {},
  modulePathIgnorePatterns: [],
  noStackTrace: false,
  notify: false,
  notifyMode: 'failure-change',
  preset: null,
  prettierPath: 'prettier',
  resetMocks: false,
  resetModules: false,
  restoreMocks: false,
  roots: ['<rootDir>'],
  snapshotSerializers: [],
  testEnvironment: 'jest-environment-node',
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[mc]?[jt]sx?$',
  testResultsProcessor: null,
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  useStderr: false,
  verbose: null,
  watch: false,
  watchPathIgnorePatterns: [],
};

export const validConfig = {
  automock: false,
  bail: 0,
  cache: true,
  cacheDirectory: '/tmp/user/jest',
  clearMocks: false,
  collectCoverage: true,
  collectCoverageFrom: ['src', '!public'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 50,
    },
  },
  expand: false,
  fakeTimers: {enableGlobally: false},
  forceExit: false,
  globals: {},
  haste: {},
  id: 'string',
  logHeapUsage: true,
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  moduleNameMapper: {
    '^React$': '<rootDir>/node_modules/react',
    '^Vue$': ['<rootDir>/node_modules/vue', '<rootDir>/node_modules/vue3'],
  },
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  modulePaths: ['/shared/vendor/modules'],
  noStackTrace: false,
  notify: false,
  notifyMode: 'failure-change',
  preset: 'react-native',
  prettierPath: '<rootDir>/node_modules/prettier',
  resetMocks: false,
  resetModules: false,
  restoreMocks: false,
  rootDir: '/',
  roots: ['<rootDir>'],
  runtime: '<rootDir>',
  setupFiles: ['<rootDir>/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/testSetupFile.js'],
  silent: true,
  snapshotSerializers: ['my-serializer-module'],
  testEnvironment: 'jest-environment-node',
  testNamePattern: 'test signature',
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[mc]?[jt]sx?$',
  testResultsProcessor: 'processor-node-module',
  testRunner: 'circus',
  transform: {
    '\\.js$': '<rootDir>/preprocessor.js',
  },
  transformIgnorePatterns: [NODE_MODULES_REGEXP],
  unmockedModulePathPatterns: ['mock'],
  updateSnapshot: true,
  useStderr: false,
  verbose: false,
  watch: false,
  watchPathIgnorePatterns: [],
  watchman: true,
};

const format = (value: string) =>
  (require('pretty-format') as typeof import('pretty-format')).format(value, {
    min: true,
  });

export const deprecatedConfig = {
  preprocessorIgnorePatterns: (config: Record<string, unknown>) =>
    `  Option ${pc.bold(
      'preprocessorIgnorePatterns',
    )} was replaced by ${pc.bold(
      'transformIgnorePatterns',
    )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${pc.bold('"transformIgnorePatterns"')}: ${pc.bold(
      `${format(config.preprocessorIgnorePatterns as string)}`,
    )}
  }

  Please update your configuration.`,

  scriptPreprocessor: (config: Record<string, unknown>) =>
    `  Option ${pc.bold('scriptPreprocessor')} was replaced by ${pc.bold(
      'transform',
    )}, which support multiple preprocessors.

  Jest now treats your current configuration as:
  {
    ${pc.bold('"transform"')}: ${pc.bold(
      `{".*": ${format(config.scriptPreprocessor as string)}}`,
    )}
  }

  Please update your configuration.`,
};
