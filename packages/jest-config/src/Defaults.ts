/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {sep} from 'path';
import {isCI} from 'ci-info';
import type {Config} from '@jest/types';
import {replacePathSepForRegex} from 'jest-regex-util';
import {NODE_MODULES} from './constants';
import getCacheDirectory from './getCacheDirectory';

const NODE_MODULES_REGEXP = replacePathSepForRegex(NODE_MODULES);

const defaultOptions: Config.DefaultOptions = {
  automock: false,
  bail: 0,
  cache: true,
  cacheDirectory: getCacheDirectory(),
  changedFilesWithAncestor: false,
  ci: isCI,
  clearMocks: false,
  collectCoverage: false,
  coveragePathIgnorePatterns: [NODE_MODULES_REGEXP],
  coverageProvider: 'babel',
  coverageReporters: ['json', 'text', 'lcov', 'clover'],
  detectLeaks: false,
  detectOpenHandles: false,
  errorOnDeprecated: false,
  expand: false,
  extensionsToTreatAsEsm: [],
  fakeTimers: {enableGlobally: false},
  forceCoverageMatch: [],
  globals: {},
  haste: {
    computeSha1: false,
    enableSymlinks: false,
    forceNodeFilesystemAPI: true,
    throwOnModuleCollision: false,
  },
  injectGlobals: true,
  listTests: false,
  maxConcurrency: 5,
  maxWorkers: '50%',
  moduleDirectories: ['node_modules'],
  moduleFileExtensions: [
    'js',
    'mjs',
    'cjs',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node',
  ],
  moduleNameMapper: {},
  modulePathIgnorePatterns: [],
  noStackTrace: false,
  notify: false,
  notifyMode: 'failure-change',
  openHandlesTimeout: 1000,
  passWithNoTests: false,
  prettierPath: 'prettier',
  resetMocks: false,
  resetModules: false,
  restoreMocks: false,
  roots: ['<rootDir>'],
  runTestsByPath: false,
  runner: 'jest-runner',
  setupFiles: [],
  setupFilesAfterEnv: [],
  skipFilter: false,
  slowTestThreshold: 5,
  snapshotFormat: {escapeString: false, printBasicPrototype: false},
  snapshotSerializers: [],
  testEnvironment: 'jest-environment-node',
  testEnvironmentOptions: {},
  testFailureExitCode: 1,
  testLocationInResults: false,
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  testPathIgnorePatterns: [NODE_MODULES_REGEXP],
  testRegex: [],
  testRunner: 'jest-circus/runner',
  testSequencer: '@jest/test-sequencer',
  transformIgnorePatterns: [NODE_MODULES_REGEXP, `\\.pnp\\.[^\\${sep}]+$`],
  useStderr: false,
  watch: false,
  watchPathIgnorePatterns: [],
  watchman: true,
  workerThreads: false,
};

export default defaultOptions;
