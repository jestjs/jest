/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

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

  if (options.updateSnapshot) {
    newConfig.updateSnapshot = options.updateSnapshot;
  }

  if (options.mode === 'watch') {
    newConfig.watch = true;
    newConfig.watchAll = false;
  } else if (options.mode === 'watchAll') {
    newConfig.watch = false;
    newConfig.watchAll = true;
  }

  if ('testPathPattern' in options) {
    newConfig.testPathPattern = options.testPathPattern || '';
  }

  if ('testNamePattern' in options) {
    newConfig.testNamePattern = options.testNamePattern || '';
  }

  newConfig.onlyChanged = false;
  newConfig.onlyChanged =
    !newConfig.watchAll &&
    !newConfig.testNamePattern &&
    !newConfig.testPathPattern;

  if (options.noSCM) {
    newConfig.noSCM = true;
  }

  if (options.passWithNoTests) {
    newConfig.passWithNoTests = true;
  }

  if ('onlyFailures' in options) {
    newConfig.onlyFailures = options.onlyFailures || false;
  }

  if ('bail' in options) {
    newConfig.bail = options.bail || false;
  }

  if ('collectCoverage' in options) {
    newConfig.collectCoverage = options.collectCoverage || false;
  }

  if (options.collectCoverageFrom) {
    newConfig.collectCoverageFrom = options.collectCoverageFrom;
  }

  if (options.collectCoverageOnlyFrom) {
    newConfig.collectCoverageOnlyFrom = options.collectCoverageOnlyFrom;
  }

  if (options.coverageDirectory) {
    newConfig.coverageDirectory = options.coverageDirectory;
  }

  if (options.coverageReporters) {
    newConfig.coverageReporters = options.coverageReporters;
  }

  if ('notify' in options) {
    newConfig.notify = options.notify || false;
  }

  if (options.notifyMode) {
    newConfig.notifyMode = options.notifyMode;
  }

  if (options.reporters) {
    newConfig.reporters = options.reporters;
  }

  if ('verbose' in options) {
    newConfig.verbose = options.verbose || false;
  }

  return Object.freeze(newConfig);
};
