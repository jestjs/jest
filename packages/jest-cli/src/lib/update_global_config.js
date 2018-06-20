/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {replacePathSepForRegex} from 'jest-regex-util';

import type {
  GlobalConfig,
  ReporterConfig,
  SnapshotUpdateState,
} from 'types/Config';

type Options = {
  bail?: boolean,
  collectCoverage?: boolean,
  collectCoverageFrom?: Array<string>,
  collectCoverageOnlyFrom?: ?{[key: string]: boolean},
  coverageDirectory?: string,
  coverageReporters?: Array<string>,
  mode?: 'watch' | 'watchAll',
  noSCM?: boolean,
  notify?: boolean,
  notifyMode?: string,
  onlyFailures?: boolean,
  passWithNoTests?: boolean,
  reporters?: Array<ReporterConfig>,
  testNamePattern?: string,
  testPathPattern?: string,
  updateSnapshot?: SnapshotUpdateState,
  verbose?: ?boolean,
};

export default (globalConfig: GlobalConfig, options: Options): GlobalConfig => {
  // $FlowFixMe Object.assign
  const newConfig: GlobalConfig = Object.assign({}, globalConfig);

  if (!options) {
    options = {};
  }

  if (options.mode === 'watch') {
    newConfig.watch = true;
    newConfig.watchAll = false;
  } else if (options.mode === 'watchAll') {
    newConfig.watch = false;
    newConfig.watchAll = true;
  }

  if (options.testNamePattern !== undefined) {
    newConfig.testNamePattern = options.testNamePattern || '';
  }

  if (options.testPathPattern !== undefined) {
    newConfig.testPathPattern =
      replacePathSepForRegex(options.testPathPattern) || '';
  }

  newConfig.onlyChanged = false;
  newConfig.onlyChanged =
    !newConfig.watchAll &&
    !newConfig.testNamePattern &&
    !newConfig.testPathPattern;

  if (options.bail !== undefined) {
    newConfig.bail = options.bail || false;
  }

  if (options.collectCoverage !== undefined) {
    newConfig.collectCoverage = options.collectCoverage || false;
  }

  if (options.collectCoverageFrom !== undefined) {
    newConfig.collectCoverageFrom = options.collectCoverageFrom;
  }

  if (options.collectCoverageOnlyFrom !== undefined) {
    newConfig.collectCoverageOnlyFrom = options.collectCoverageOnlyFrom;
  }

  if (options.coverageDirectory !== undefined) {
    newConfig.coverageDirectory = options.coverageDirectory;
  }

  if (options.coverageReporters !== undefined) {
    newConfig.coverageReporters = options.coverageReporters;
  }

  if (options.noSCM) {
    newConfig.noSCM = true;
  }

  if (options.notify !== undefined) {
    newConfig.notify = options.notify || false;
  }

  if (options.notifyMode !== undefined) {
    newConfig.notifyMode = options.notifyMode;
  }

  if (options.onlyFailures !== undefined) {
    newConfig.onlyFailures = options.onlyFailures || false;
  }

  if (options.passWithNoTests !== undefined) {
    newConfig.passWithNoTests = true;
  }

  if (options.reporters !== undefined) {
    newConfig.reporters = options.reporters;
  }

  if (options.updateSnapshot !== undefined) {
    newConfig.updateSnapshot = options.updateSnapshot;
  }

  if (options.verbose !== undefined) {
    newConfig.verbose = options.verbose || false;
  }

  return Object.freeze(newConfig);
};
