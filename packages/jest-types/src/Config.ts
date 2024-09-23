/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {ForegroundColor} from 'chalk';
import type {ReportOptions} from 'istanbul-reports';
import type {Arguments} from 'yargs';
import type {TestPathPatterns} from '@jest/pattern';
import type {InitialOptions, SnapshotFormat} from '@jest/schemas';

export type {InitialOptions} from '@jest/schemas';

type CoverageProvider = 'babel' | 'v8';

export type FakeableAPI =
  | 'Date'
  | 'hrtime'
  | 'nextTick'
  | 'performance'
  | 'queueMicrotask'
  | 'requestAnimationFrame'
  | 'cancelAnimationFrame'
  | 'requestIdleCallback'
  | 'cancelIdleCallback'
  | 'setImmediate'
  | 'clearImmediate'
  | 'setInterval'
  | 'clearInterval'
  | 'setTimeout'
  | 'clearTimeout';

export type GlobalFakeTimersConfig = {
  /**
   * Whether fake timers should be enabled globally for all test files.
   *
   * @defaultValue
   * The default is `false`.
   */
  enableGlobally?: boolean;
};

export type AdvanceTimersConfig =
  | {
      mode: 'manual' | 'nextAsync';
    }
  | {
      mode: 'interval';
      delta?: number;
    };

export type FakeTimersConfig = {
  /**
   * If set to `true` all timers will be advanced automatically
   * by 20 milliseconds every 20 milliseconds. A custom time delta
   * may be provided by passing a number.
   *
   * There are 3 different types of modes for advancing timers:
   *
   * - 'manual': Timers do not advance without explicit, manual calls to the tick
   *      APIs (`jest.advanceTimersToNextTimer`, `jest.runAllTimers`, etc).
   * - 'nextAsync': Jest will continuously await 'jest.advanceTimersToNextTimerAsync' until the mode changes.
   *      With this mode, jest will advance the clock to the next timer in the queue after a macrotask.
   *      As a result, tests can be written in a way that is independent from whether fake timers are installed.
   *      Tests can always be written to wait for timers to resolve, even when using fake timers.
   * - 'interval': In this mode, all timers will be advanced automatically
   *      by the number of milliseconds provided in the delta. If the delta is
   *      not specified, 20 will be used by default.
   *
   * The 'nextAsync' mode differs from `interval` in two key ways:
   *  1. The microtask queue is allowed to empty between each timer execution,
   *     as would be the case without fake timers installed.
   *  1. It advances as quickly and as far as necessary. If the next timer in
   *     the queue is at 1000ms, it will advance 1000ms immediately whereas interval,
   *     without manually advancing time in the test, would take `1000 / advanceTimersMs`
   *     real time to reach and execute the timer.
   *
   * @defaultValue
   * The default mode is `'manual'` (equivalent to `false`).
   */
  advanceTimers?: boolean | number | AdvanceTimersConfig;
  /**
   * List of names of APIs (e.g. `Date`, `nextTick()`, `setImmediate()`,
   * `setTimeout()`) that should not be faked.
   *
   * @defaultValue
   * The default is `[]`, meaning all APIs are faked.
   */
  doNotFake?: Array<FakeableAPI>;
  /**
   * Sets current system time to be used by fake timers, in milliseconds.
   *
   * @defaultValue
   * The default is `Date.now()`.
   */
  now?: number | Date;
  /**
   * The maximum number of recursive timers that will be run when calling
   * `jest.runAllTimers()`.
   *
   * @defaultValue
   * The default is `100_000` timers.
   */
  timerLimit?: number;
  /**
   * Use the old fake timers implementation instead of one backed by
   * [`@sinonjs/fake-timers`](https://github.com/sinonjs/fake-timers).
   *
   * @defaultValue
   * The default is `false`.
   */
  legacyFakeTimers?: false;
};

export type LegacyFakeTimersConfig = {
  /**
   * Use the old fake timers implementation instead of one backed by
   * [`@sinonjs/fake-timers`](https://github.com/sinonjs/fake-timers).
   *
   * @defaultValue
   * The default is `false`.
   */
  legacyFakeTimers?: true;
};

type FakeTimers = GlobalFakeTimersConfig &
  (
    | (FakeTimersConfig & {
        now?: Exclude<FakeTimersConfig['now'], Date>;
      })
    | LegacyFakeTimersConfig
  );

export type HasteConfig = {
  /** Whether to hash files using SHA-1. */
  computeSha1?: boolean;
  /** The platform to use as the default, e.g. 'ios'. */
  defaultPlatform?: string | null;
  /** Force use of Node's `fs` APIs rather than shelling out to `find` */
  forceNodeFilesystemAPI?: boolean;
  /**
   * Whether to follow symlinks when crawling for files.
   *   This options cannot be used in projects which use watchman.
   *   Projects with `watchman` set to true will error if this option is set to true.
   */
  enableSymlinks?: boolean;
  /** string to a custom implementation of Haste. */
  hasteImplModulePath?: string;
  /** All platforms to target, e.g ['ios', 'android']. */
  platforms?: Array<string>;
  /** Whether to throw on error on module collision. */
  throwOnModuleCollision?: boolean;
  /** Custom HasteMap module */
  hasteMapModulePath?: string;
  /** Whether to retain all files, allowing e.g. search for tests in `node_modules`. */
  retainAllFiles?: boolean;
};

export type CoverageReporterName = keyof ReportOptions;

export type CoverageReporterWithOptions<K = CoverageReporterName> =
  K extends CoverageReporterName
    ? ReportOptions[K] extends never
      ? never
      : [K, Partial<ReportOptions[K]>]
    : never;

export type CoverageReporters = Array<
  CoverageReporterName | CoverageReporterWithOptions
>;

export type ReporterConfig = [string, Record<string, unknown>];
export type TransformerConfig = [string, Record<string, unknown>];

export interface ConfigGlobals {
  [K: string]: unknown;
}

export type DefaultOptions = {
  automock: boolean;
  bail: number;
  cache: boolean;
  cacheDirectory: string;
  changedFilesWithAncestor: boolean;
  ci: boolean;
  clearMocks: boolean;
  collectCoverage: boolean;
  coveragePathIgnorePatterns: Array<string>;
  coverageReporters: Array<CoverageReporterName>;
  coverageProvider: CoverageProvider;
  detectLeaks: boolean;
  detectOpenHandles: boolean;
  errorOnDeprecated: boolean;
  expand: boolean;
  extensionsToTreatAsEsm: Array<string>;
  fakeTimers: FakeTimers;
  forceCoverageMatch: Array<string>;
  globals: ConfigGlobals;
  haste: HasteConfig;
  injectGlobals: boolean;
  listTests: boolean;
  maxConcurrency: number;
  maxWorkers: number | string;
  moduleDirectories: Array<string>;
  moduleFileExtensions: Array<string>;
  moduleNameMapper: Record<string, string | Array<string>>;
  modulePathIgnorePatterns: Array<string>;
  noStackTrace: boolean;
  notify: boolean;
  notifyMode: NotifyMode;
  openHandlesTimeout: number;
  passWithNoTests: boolean;
  prettierPath: string;
  resetMocks: boolean;
  resetModules: boolean;
  restoreMocks: boolean;
  roots: Array<string>;
  runTestsByPath: boolean;
  runner: string;
  setupFiles: Array<string>;
  setupFilesAfterEnv: Array<string>;
  skipFilter: boolean;
  slowTestThreshold: number;
  snapshotFormat: SnapshotFormat;
  snapshotSerializers: Array<string>;
  testEnvironment: string;
  testEnvironmentOptions: Record<string, unknown>;
  testFailureExitCode: number;
  testLocationInResults: boolean;
  testMatch: Array<string>;
  testPathIgnorePatterns: Array<string>;
  testRegex: Array<string>;
  testRunner: string;
  testSequencer: string;
  transformIgnorePatterns: Array<string>;
  useStderr: boolean;
  waitNextEventLoopTurnForUnhandledRejectionEvents: boolean;
  watch: boolean;
  watchPathIgnorePatterns: Array<string>;
  watchman: boolean;
  workerThreads: boolean;
};

export type DisplayName = {
  name: string;
  color: typeof ForegroundColor;
};

export type InitialOptionsWithRootDir = InitialOptions &
  Required<Pick<InitialOptions, 'rootDir'>>;

export type InitialProjectOptions = Pick<
  InitialOptions & {cwd?: string},
  keyof ProjectConfig
>;

export type SnapshotUpdateState = 'all' | 'new' | 'none';

type NotifyMode =
  | 'always'
  | 'failure'
  | 'success'
  | 'change'
  | 'success-change'
  | 'failure-change';

export type CoverageThresholdValue = {
  branches?: number;
  functions?: number;
  lines?: number;
  statements?: number;
};

type CoverageThreshold = {
  [path: string]: CoverageThresholdValue;
  global: CoverageThresholdValue;
};

type ShardConfig = {
  shardIndex: number;
  shardCount: number;
};

export type GlobalConfig = {
  bail: number;
  changedSince?: string;
  changedFilesWithAncestor: boolean;
  ci: boolean;
  collectCoverage: boolean;
  collectCoverageFrom: Array<string>;
  coverageDirectory: string;
  coveragePathIgnorePatterns?: Array<string>;
  coverageProvider: CoverageProvider;
  coverageReporters: CoverageReporters;
  coverageThreshold?: CoverageThreshold;
  detectLeaks: boolean;
  detectOpenHandles: boolean;
  expand: boolean;
  filter?: string;
  findRelatedTests: boolean;
  forceExit: boolean;
  json: boolean;
  globalSetup?: string;
  globalTeardown?: string;
  lastCommit: boolean;
  logHeapUsage: boolean;
  listTests: boolean;
  maxConcurrency: number;
  maxWorkers: number;
  noStackTrace: boolean;
  nonFlagArgs: Array<string>;
  noSCM?: boolean;
  notify: boolean;
  notifyMode: NotifyMode;
  outputFile?: string;
  onlyChanged: boolean;
  onlyFailures: boolean;
  openHandlesTimeout: number;
  passWithNoTests: boolean;
  projects: Array<string>;
  randomize?: boolean;
  replname?: string;
  reporters?: Array<ReporterConfig>;
  runInBand: boolean;
  runTestsByPath: boolean;
  rootDir: string;
  seed: number;
  showSeed?: boolean;
  shard?: ShardConfig;
  silent?: boolean;
  skipFilter: boolean;
  snapshotFormat: SnapshotFormat;
  errorOnDeprecated: boolean;
  testFailureExitCode: number;
  testNamePattern?: string;
  testPathPatterns: TestPathPatterns;
  testResultsProcessor?: string;
  testSequencer: string;
  testTimeout?: number;
  updateSnapshot: SnapshotUpdateState;
  useStderr: boolean;
  verbose?: boolean;
  waitNextEventLoopTurnForUnhandledRejectionEvents: boolean;
  watch: boolean;
  watchAll: boolean;
  watchman: boolean;
  watchPlugins?: Array<{
    path: string;
    config: Record<string, unknown>;
  }> | null;
  workerIdleMemoryLimit?: number;
  // TODO: make non-optional in Jest 30
  workerThreads?: boolean;
};

export type ProjectConfig = {
  automock: boolean;
  cache: boolean;
  cacheDirectory: string;
  clearMocks: boolean;
  collectCoverageFrom: Array<string>;
  coverageDirectory: string;
  coveragePathIgnorePatterns: Array<string>;
  coverageReporters: CoverageReporters;
  cwd: string;
  dependencyExtractor?: string;
  detectLeaks: boolean;
  detectOpenHandles: boolean;
  displayName?: DisplayName;
  errorOnDeprecated: boolean;
  extensionsToTreatAsEsm: Array<string>;
  fakeTimers: FakeTimers;
  filter?: string;
  forceCoverageMatch: Array<string>;
  globalSetup?: string;
  globalTeardown?: string;
  globals: ConfigGlobals;
  haste: HasteConfig;
  id: string;
  injectGlobals: boolean;
  moduleDirectories: Array<string>;
  moduleFileExtensions: Array<string>;
  moduleNameMapper: Array<[string, string]>;
  modulePathIgnorePatterns: Array<string>;
  modulePaths?: Array<string>;
  openHandlesTimeout: number;
  preset?: string;
  prettierPath: string;
  reporters: Array<string | ReporterConfig>;
  resetMocks: boolean;
  resetModules: boolean;
  resolver?: string;
  restoreMocks: boolean;
  rootDir: string;
  roots: Array<string>;
  runner: string;
  runtime?: string;
  sandboxInjectedGlobals: Array<keyof typeof globalThis>;
  setupFiles: Array<string>;
  setupFilesAfterEnv: Array<string>;
  skipFilter: boolean;
  skipNodeResolution?: boolean;
  slowTestThreshold: number;
  snapshotResolver?: string;
  snapshotSerializers: Array<string>;
  snapshotFormat: SnapshotFormat;
  testEnvironment: string;
  testEnvironmentOptions: Record<string, unknown>;
  testMatch: Array<string>;
  testLocationInResults: boolean;
  testPathIgnorePatterns: Array<string>;
  testRegex: Array<string | RegExp>;
  testRunner: string;
  testTimeout: number;
  transform: Array<[string, string, Record<string, unknown>]>;
  transformIgnorePatterns: Array<string>;
  watchPathIgnorePatterns: Array<string>;
  unmockedModulePathPatterns?: Array<string>;
  waitNextEventLoopTurnForUnhandledRejectionEvents: boolean;
  workerIdleMemoryLimit?: number;
};

export type SetupAfterEnvPerfStats = {
  setupAfterEnvStart: number;
  setupAfterEnvEnd: number;
};

export type Argv = Arguments<
  Partial<{
    all: boolean;
    automock: boolean;
    bail: boolean | number;
    cache: boolean;
    cacheDirectory: string;
    changedFilesWithAncestor: boolean;
    changedSince: string;
    ci: boolean;
    clearCache: boolean;
    clearMocks: boolean;
    collectCoverage: boolean;
    collectCoverageFrom: string;
    color: boolean;
    colors: boolean;
    config: string;
    coverage: boolean;
    coverageDirectory: string;
    coveragePathIgnorePatterns: Array<string>;
    coverageReporters: Array<string>;
    coverageThreshold: string;
    debug: boolean;
    env: string;
    expand: boolean;
    findRelatedTests: boolean;
    forceExit: boolean;
    globals: string;
    globalSetup: string | null | undefined;
    globalTeardown: string | null | undefined;
    haste: string;
    ignoreProjects: Array<string>;
    injectGlobals: boolean;
    json: boolean;
    lastCommit: boolean;
    logHeapUsage: boolean;
    maxWorkers: number | string;
    moduleDirectories: Array<string>;
    moduleFileExtensions: Array<string>;
    moduleNameMapper: string;
    modulePathIgnorePatterns: Array<string>;
    modulePaths: Array<string>;
    noStackTrace: boolean;
    notify: boolean;
    notifyMode: string;
    onlyChanged: boolean;
    onlyFailures: boolean;
    outputFile: string;
    preset: string | null | undefined;
    prettierPath: string | null | undefined;
    projects: Array<string>;
    randomize: boolean;
    reporters: Array<string>;
    resetMocks: boolean;
    resetModules: boolean;
    resolver: string | null | undefined;
    restoreMocks: boolean;
    rootDir: string;
    roots: Array<string>;
    runInBand: boolean;
    seed: number;
    showSeed: boolean;
    selectProjects: Array<string>;
    setupFiles: Array<string>;
    setupFilesAfterEnv: Array<string>;
    shard: string;
    showConfig: boolean;
    silent: boolean;
    snapshotSerializers: Array<string>;
    testEnvironment: string;
    testEnvironmentOptions: string;
    testFailureExitCode: string | null | undefined;
    testMatch: Array<string>;
    testNamePattern: string;
    testPathIgnorePatterns: Array<string>;
    testPathPatterns: Array<string>;
    testRegex: string | Array<string>;
    testResultsProcessor: string;
    testRunner: string;
    testSequencer: string;
    testTimeout: number | null | undefined;
    transform: string;
    transformIgnorePatterns: Array<string>;
    unmockedModulePathPatterns: Array<string> | null | undefined;
    updateSnapshot: boolean;
    useStderr: boolean;
    verbose: boolean;
    version: boolean;
    watch: boolean;
    watchAll: boolean;
    watchman: boolean;
    watchPathIgnorePatterns: Array<string>;
    workerIdleMemoryLimit: number | string;
    workerThreads: boolean;
  }>
>;
