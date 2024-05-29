/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TestPathPatterns} from '@jest/pattern';
import type {Config} from '@jest/types';

const DEFAULT_GLOBAL_CONFIG: Config.GlobalConfig = {
  bail: 0,
  changedFilesWithAncestor: false,
  changedSince: '',
  ci: false,
  collectCoverage: false,
  collectCoverageFrom: [],
  coverageDirectory: 'coverage',
  coverageProvider: 'babel',
  coverageReporters: [],
  coverageThreshold: {global: {}},
  detectLeaks: false,
  detectOpenHandles: false,
  errorOnDeprecated: false,
  expand: false,
  filter: undefined,
  findRelatedTests: false,
  forceExit: false,
  globalSetup: undefined,
  globalTeardown: undefined,
  json: false,
  lastCommit: false,
  listTests: false,
  logHeapUsage: false,
  maxConcurrency: 5,
  maxWorkers: 2,
  noSCM: undefined,
  noStackTrace: false,
  nonFlagArgs: [],
  notify: false,
  notifyMode: 'failure-change',
  onlyChanged: false,
  onlyFailures: false,
  openHandlesTimeout: 1000,
  outputFile: undefined,
  passWithNoTests: false,
  projects: [],
  replname: undefined,
  reporters: [],
  rootDir: '/test_root_dir/',
  runInBand: false,
  runTestsByPath: false,
  seed: 1234,
  silent: false,
  skipFilter: false,
  snapshotFormat: {},
  testFailureExitCode: 1,
  testNamePattern: '',
  testPathPatterns: new TestPathPatterns([]),
  testResultsProcessor: undefined,
  testSequencer: '@jest/test-sequencer',
  testTimeout: 5000,
  updateSnapshot: 'none',
  useStderr: false,
  verbose: false,
  waitNextEventLoopTurnForUnhandledRejectionEvents: false,
  watch: false,
  watchAll: false,
  watchPlugins: [],
  watchman: false,
};

const DEFAULT_PROJECT_CONFIG: Config.ProjectConfig = {
  automock: false,
  cache: false,
  cacheDirectory: '/test_cache_dir/',
  clearMocks: false,
  collectCoverageFrom: ['src', '!public'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [],
  coverageReporters: [],
  cwd: '/test_root_dir/',
  detectLeaks: false,
  detectOpenHandles: false,
  displayName: undefined,
  errorOnDeprecated: false,
  extensionsToTreatAsEsm: [],
  fakeTimers: {enableGlobally: false},
  filter: undefined,
  forceCoverageMatch: [],
  globalSetup: undefined,
  globalTeardown: undefined,
  globals: {},
  haste: {},
  id: 'test_name',
  injectGlobals: true,
  moduleDirectories: [],
  moduleFileExtensions: ['js'],
  moduleNameMapper: [],
  modulePathIgnorePatterns: [],
  modulePaths: [],
  openHandlesTimeout: 1000,
  prettierPath: 'prettier',
  reporters: [
    'default',
    'custom-reporter-1',
    ['custom-reporter-2', {configValue: true}],
  ],
  resetMocks: false,
  resetModules: false,
  resolver: undefined,
  restoreMocks: false,
  rootDir: '/test_root_dir/',
  roots: [],
  runner: 'jest-runner',
  runtime: '/test_module_loader_path',
  sandboxInjectedGlobals: [],
  setupFiles: [],
  setupFilesAfterEnv: [],
  skipFilter: false,
  skipNodeResolution: false,
  slowTestThreshold: 5,
  snapshotFormat: {},
  snapshotResolver: undefined,
  snapshotSerializers: [],
  testEnvironment: 'node',
  testEnvironmentOptions: {},
  testLocationInResults: false,
  testMatch: [],
  testPathIgnorePatterns: [],
  testRegex: ['\\.test\\.js$'],
  testRunner: 'jest-circus/runner',
  testTimeout: 5000,
  transform: [],
  transformIgnorePatterns: [],
  unmockedModulePathPatterns: undefined,
  waitNextEventLoopTurnForUnhandledRejectionEvents: false,
  watchPathIgnorePatterns: [],
};

export const makeGlobalConfig = (
  overrides: Partial<Config.GlobalConfig> = {},
): Config.GlobalConfig => {
  const overridesKeys = new Set(Object.keys(overrides));
  for (const key of Object.keys(DEFAULT_GLOBAL_CONFIG)) {
    overridesKeys.delete(key);
  }

  if (overridesKeys.size > 0) {
    throw new Error(`
      Properties that are not part of GlobalConfig type were passed:
      ${JSON.stringify([...overridesKeys])}
    `);
  }

  return {...DEFAULT_GLOBAL_CONFIG, ...overrides};
};

export const makeProjectConfig = (
  overrides: Partial<Config.ProjectConfig> = {},
): Config.ProjectConfig => {
  const overridesKeys = new Set(Object.keys(overrides));
  for (const key of Object.keys(DEFAULT_PROJECT_CONFIG)) {
    overridesKeys.delete(key);
  }

  if (overridesKeys.size > 0) {
    throw new Error(`
      Properties that are not part of ProjectConfig type were passed:
      ${JSON.stringify([...overridesKeys])}
    `);
  }

  return {...DEFAULT_PROJECT_CONFIG, ...overrides};
};
