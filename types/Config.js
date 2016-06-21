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

export type Path = string;

export type HasteConfig = {
  providesModuleNodeModules: Array<string>,
  defaultPlatform?: ?string,
  platforms?: Array<string>,
};

export type ConfigGlobals = Object;

type BaseConfig = {
  automock: boolean,
  bail: boolean,
  cacheDirectory: Path,
  coverageCollector: Path,
  coverageReporters: Array<string>,
  globals: ConfigGlobals,
  haste: HasteConfig,
  mocksPattern: string,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  modulePathIgnorePatterns: Array<string>,
  noHighlight: boolean,
  noStackTrace: boolean,
  notify: boolean,
  testEnvData: {},
  testEnvironment: string,
  testPathDirs: Array<Path>,
  testPathIgnorePatterns: Array<string>,
  testRegex: string,
  testReporter: Path,
  testURL: string,
  useStderr: boolean,
  verbose: boolean,
};

export type DefaultConfig = BaseConfig & {
  moduleNameMapper: {},
};

export type Config = BaseConfig & {
  cache: boolean,
  collectCoverageOnlyFrom: {[key: string]: Path},
  colors: boolean,
  coverageThreshold: {
    global: {
      [key: string]: number,
    },
  },
  moduleLoader: Path,
  moduleNameMapper: Array<string>,
  modulePaths: Array<string>,
  name: string,
  persistModuleRegistryBetweenSpecs: boolean,
  preprocessorIgnorePatterns: Array<string>,
  rootDir: Path,
  scriptPreprocessor: Path,
  setupTestFrameworkScriptFile: Path,
  setupFiles: Array<Path>,
  testcheckOptions: {},
  testFileExtensions: Array<string>,
  testDirectoryName: string,
  updateSnapshot: boolean,
  watchman: boolean,
};
