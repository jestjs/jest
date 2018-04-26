/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type Path = string;
export type Glob = string;

export type HasteConfig = {|
  defaultPlatform?: ?string,
  hasteImplModulePath?: string,
  platforms?: Array<string>,
  providesModuleNodeModules: Array<string>,
|};

export type ReporterConfig = [string, Object];

export type ConfigGlobals = Object;

export type DefaultOptions = {|
  automock: boolean,
  bail: boolean,
  browser: boolean,
  cache: boolean,
  cacheDirectory: Path,
  changedFilesWithAncestor: boolean,
  clearMocks: boolean,
  coveragePathIgnorePatterns: Array<string>,
  coverageReporters: Array<string>,
  expand: boolean,
  forceCoverageMatch: Array<Glob>,
  globals: ConfigGlobals,
  globalSetup: ?string,
  globalTeardown: ?string,
  haste: HasteConfig,
  detectLeaks: boolean,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  moduleNameMapper: {[key: string]: string},
  modulePathIgnorePatterns: Array<string>,
  noStackTrace: boolean,
  notify: boolean,
  notifyMode: string,
  preset: ?string,
  resetMocks: boolean,
  resetModules: boolean,
  restoreMocks: boolean,
  runner: string,
  runTestsByPath: boolean,
  snapshotSerializers: Array<Path>,
  snapshotTag?: ?string,
  testEnvironment: string,
  testEnvironmentOptions: Object,
  testFailureExitCode: string | number,
  testLocationInResults: boolean,
  testMatch: Array<Glob>,
  testPathIgnorePatterns: Array<string>,
  testRegex: string,
  testResultsProcessor: ?string,
  testURL: string,
  timers: 'real' | 'fake',
  transformIgnorePatterns: Array<Glob>,
  watchPathIgnorePatterns: Array<string>,
  useStderr: boolean,
  verbose: ?boolean,
  watch: boolean,
  watchman: boolean,
|};

export type InitialOptions = {
  automock?: boolean,
  bail?: boolean,
  browser?: boolean,
  cache?: boolean,
  cacheDirectory?: Path,
  clearMocks?: boolean,
  changedFilesWithAncestor?: boolean,
  changedSince?: string,
  collectCoverage?: boolean,
  collectCoverageFrom?: Array<Glob>,
  collectCoverageOnlyFrom?: {[key: string]: boolean},
  coverageDirectory?: string,
  coveragePathIgnorePatterns?: Array<string>,
  coverageReporters?: Array<string>,
  coverageThreshold?: {global: {[key: string]: number}},
  detectLeaks?: boolean,
  displayName?: string,
  expand?: boolean,
  findRelatedTests?: boolean,
  forceCoverageMatch?: Array<Glob>,
  forceExit?: boolean,
  json?: boolean,
  globals?: ConfigGlobals,
  globalSetup?: ?string,
  globalTeardown?: ?string,
  haste?: HasteConfig,
  reporters?: Array<ReporterConfig | string>,
  logHeapUsage?: boolean,
  lastCommit?: boolean,
  listTests?: boolean,
  mapCoverage?: boolean,
  moduleDirectories?: Array<string>,
  moduleFileExtensions?: Array<string>,
  moduleLoader?: Path,
  moduleNameMapper?: {[key: string]: string},
  modulePathIgnorePatterns?: Array<string>,
  modulePaths?: Array<string>,
  name?: string,
  noStackTrace?: boolean,
  notify?: boolean,
  notifyMode?: string,
  onlyChanged?: boolean,
  outputFile?: Path,
  passWithNoTests?: boolean,
  preprocessorIgnorePatterns?: Array<Glob>,
  preset?: ?string,
  projects?: Array<Glob>,
  replname?: ?string,
  resetMocks?: boolean,
  resetModules?: boolean,
  resolver?: ?Path,
  restoreMocks?: boolean,
  rootDir: Path,
  roots?: Array<Path>,
  runner?: string,
  runTestsByPath?: boolean,
  scriptPreprocessor?: string,
  setupFiles?: Array<Path>,
  setupTestFrameworkScriptFile?: Path,
  silent?: boolean,
  skipNodeResolution?: boolean,
  snapshotSerializers?: Array<Path>,
  snapshotTag?: ?string,
  testEnvironment?: string,
  testEnvironmentOptions?: Object,
  testFailureExitCode?: string | number,
  testLocationInResults?: boolean,
  testMatch?: Array<Glob>,
  testNamePattern?: string,
  testPathDirs?: Array<Path>,
  testPathIgnorePatterns?: Array<string>,
  testRegex?: string,
  testResultsProcessor?: ?string,
  testRunner?: string,
  testURL?: string,
  timers?: 'real' | 'fake',
  transform?: {[key: string]: string},
  transformIgnorePatterns?: Array<Glob>,
  watchPathIgnorePatterns?: Array<string>,
  unmockedModulePathPatterns?: Array<string>,
  updateSnapshot?: boolean,
  useStderr?: boolean,
  verbose?: ?boolean,
  watch?: boolean,
  watchAll?: boolean,
  watchman?: boolean,
  watchPlugins?: Array<string>,
};

export type SnapshotUpdateState = 'all' | 'new' | 'none';

export type GlobalConfig = {|
  bail: boolean,
  changedSince: string,
  changedFilesWithAncestor: boolean,
  collectCoverage: boolean,
  collectCoverageFrom: Array<Glob>,
  collectCoverageOnlyFrom: ?{[key: string]: boolean},
  coverageDirectory: string,
  coverageReporters: Array<string>,
  coverageThreshold: {global: {[key: string]: number}},
  detectLeaks: boolean,
  enabledTestsMap: ?{[key: string]: {[key: string]: boolean}},
  expand: boolean,
  findRelatedTests: boolean,
  forceExit: boolean,
  json: boolean,
  globalSetup: ?string,
  globalTeardown: ?string,
  lastCommit: boolean,
  logHeapUsage: boolean,
  listTests: boolean,
  maxWorkers: number,
  noStackTrace: boolean,
  nonFlagArgs: Array<string>,
  noSCM: ?boolean,
  notify: boolean,
  notifyMode: string,
  outputFile: ?Path,
  onlyChanged: boolean,
  onlyFailures: boolean,
  passWithNoTests: boolean,
  projects: Array<Glob>,
  replname: ?string,
  reporters: Array<ReporterConfig>,
  runTestsByPath: boolean,
  rootDir: Path,
  silent: boolean,
  snapshotTag?: ?string,
  testFailureExitCode: number,
  testNamePattern: string,
  testPathPattern: string,
  testResultsProcessor: ?string,
  updateSnapshot: SnapshotUpdateState,
  useStderr: boolean,
  verbose: ?boolean,
  watch: boolean,
  watchAll: boolean,
  watchman: boolean,
  watchPlugins: ?Array<string>,
|};

export type ProjectConfig = {|
  automock: boolean,
  browser: boolean,
  cache: boolean,
  cacheDirectory: Path,
  clearMocks: boolean,
  coveragePathIgnorePatterns: Array<string>,
  cwd: Path,
  detectLeaks: boolean,
  displayName: ?string,
  forceCoverageMatch: Array<Glob>,
  globals: ConfigGlobals,
  haste: HasteConfig,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  moduleLoader: Path,
  moduleNameMapper: Array<[string, string]>,
  modulePathIgnorePatterns: Array<string>,
  modulePaths: Array<string>,
  name: string,
  resetMocks: boolean,
  resetModules: boolean,
  resolver: ?Path,
  restoreMocks: boolean,
  rootDir: Path,
  roots: Array<Path>,
  runner: string,
  setupFiles: Array<Path>,
  setupTestFrameworkScriptFile: ?Path,
  skipNodeResolution: boolean,
  snapshotSerializers: Array<Path>,
  snapshotTag?: ?string,
  testEnvironment: string,
  testEnvironmentOptions: Object,
  testMatch: Array<Glob>,
  testLocationInResults: boolean,
  testPathIgnorePatterns: Array<string>,
  testRegex: string,
  testRunner: string,
  testURL: string,
  timers: 'real' | 'fake',
  transform: Array<[string, Path]>,
  transformIgnorePatterns: Array<Glob>,
  watchPathIgnorePatterns: Array<string>,
  unmockedModulePathPatterns: ?Array<string>,
|};
