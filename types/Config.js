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
  platforms: Array<string>,
};

export type ConfigGlobals = Object;

export type Config = {
  automock: boolean,
  bail: boolean,
  cacheDirectory: Path,
  colors: boolean,
  coverageCollector: Path,
  coverageReporters: Array<string>,
  globals: ConfigGlobals,
  haste: HasteConfig,
  mocksPattern: string,
  moduleDirectories: Array<string>,
  moduleFileExtensions: Array<string>,
  moduleLoader: Path,
  moduleNameMapper: {[key: string]: string},
  modulePathIgnorePatterns: Array<string>,
  noHighlight: boolean,
  noStackTrace: boolean,
  rootDir: Path,
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
