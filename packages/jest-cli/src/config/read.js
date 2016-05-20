/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const loadFromFile = require('./loadFromFile');
const loadFromPackage = require('./loadFromPackage');
const normalize = require('./normalize');
const path = require('path');

function readConfig(argv, packageRoot) {
  return readRawConfig(argv, packageRoot).then(config => {
    if (argv.coverage) {
      config.collectCoverage = true;
    }

    if (argv.testEnvData) {
      config.testEnvData = argv.testEnvData;
    }

    config.noHighlight =
      argv.noHighlight || (!argv.colors && !process.stdout.isTTY);

    if (argv.verbose) {
      config.verbose = argv.verbose;
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

    if (argv.setupTestFrameworkScriptFile) {
      config.setupTestFrameworkScriptFile = argv.setupTestFrameworkScriptFile;
    }

    config.noStackTrace = argv.noStackTrace;

    return config;
  });
}

function readRawConfig(argv, root) {
  if (typeof argv.config === 'string') {
    return loadFromFile(path.resolve(process.cwd(), argv.config));
  }

  if (typeof argv.config === 'object') {
    const config = Object.assign({}, argv.config);
    config.rootDir = config.rootDir || root;
    return Promise.resolve(normalize(config, argv));
  }

  return loadFromPackage(path.join(root, 'package.json'), argv)
    .then(config => config || normalize({rootDir: root}, argv));
}

module.exports = readConfig;
