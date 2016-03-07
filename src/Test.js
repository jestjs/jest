/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Console = require('./Console');

class Test {

  constructor(path, config, moduleMap) {
    this._path = path;
    this._config = config;
    this._moduleMap = moduleMap;
  }

  run() {
    const path = this._path;
    const config = this._config;
    const moduleMap = this._moduleMap;
    const TestEnvironment = require(config.testEnvironment);
    const TestRunner = require(config.testRunner);
    const ModuleLoader = require(config.moduleLoader);

    const env = new TestEnvironment(config);
    env.global.console = new Console(
      config.useStderr ? process.stderr : process.stdout,
      process.stderr
    );
    env.testFilePath = path;
    const moduleLoader = new ModuleLoader(config, env, moduleMap);
    if (config.setupFiles.length) {
      for (let i = 0; i < config.setupFiles.length; i++) {
        moduleLoader.requireModule(null, config.setupFiles[i]);
      }
    }

    const start = Date.now();
    return TestRunner(config, env, moduleLoader, path)
      .then(result => {
        result.perfStats = {start, end: Date.now()};
        result.testFilePath = path;
        result.coverage = moduleLoader.getAllCoverageInfo();
        return result;
      })
      .then(
        result => Promise.resolve().then(() => {
          env.dispose();
          if (config.logHeapUsage) {
            if (global.gc) {
              global.gc();
            }
            result.memoryUsage = process.memoryUsage().heapUsed;
          }
          return result;
        }),
        err => Promise.resolve().then(() => {
          env.dispose();
          throw err;
        })
      );
  }

}

module.exports = Test;
