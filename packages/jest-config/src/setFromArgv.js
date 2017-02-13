/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

function setFromArgv(config, argv) {
  if (argv.coverage) {
    config.collectCoverage = true;
  }

  if (argv.mapCoverage) {
    config.mapCoverage = true;
  }

  if (argv.verbose) {
    config.verbose = argv.verbose;
  }

  if (argv.notify) {
    config.notify = argv.notify;
  }

  if (argv.bail) {
    config.bail = argv.bail;
  }

  if (argv.cache !== null) {
    config.cache = argv.cache;
  }

  if (argv.watchman !== null) {
    config.watchman = argv.watchman;
  }

  if (argv.useStderr) {
    config.useStderr = argv.useStderr;
  }

  if (argv.json) {
    config.useStderr = true;
  }

  if (argv.logHeapUsage) {
    config.logHeapUsage = argv.logHeapUsage;
  }

  if (argv.replname) {
    config.replname = argv.replname;
  }

  if (argv.silent) {
    config.silent = true;
  }

  if (argv.setupTestFrameworkScriptFile) {
    config.setupTestFrameworkScriptFile = argv.setupTestFrameworkScriptFile;
  }

  if (argv.testNamePattern) {
    config.testNamePattern = argv.testNamePattern;
  }

  if (argv.updateSnapshot) {
    config.updateSnapshot = argv.updateSnapshot;
  }

  if (argv.watch || argv.watchAll) {
    config.watch = true;
  }

  if (argv.expand) {
    config.expand = argv.expand;
  }

  if (argv.testResultsProcessor) {
    config.testResultsProcessor = argv.testResultsProcessor;
  }

  config.noStackTrace = argv.noStackTrace;

  return config;
}

module.exports = setFromArgv;
