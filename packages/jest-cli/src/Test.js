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

import type {Path, Config} from 'types/Config';
import type Resolver from '../../jest-resolve/src';

const Console = require('./Console');
const NullConsole = require('./NullConsole');

class Test {

  _path: Path;
  _config: Config;
  _resolver: Resolver;

  constructor(path: Path, config: Config, resolver: Resolver) {
    this._path = path;
    this._config = config;
    this._resolver = resolver;
  }

  run() {
    const path = this._path;
    const config = this._config;
    const resolver = this._resolver;
    /* $FlowFixMe */
    const TestEnvironment = require(config.testEnvironment);
    /* $FlowFixMe */
    const TestRunner = require(config.testRunner);
    /* $FlowFixMe */
    const ModuleLoader = require(config.moduleLoader || 'jest-runtime');

    const env = new TestEnvironment(config);
    const TestConsole = config.silent ? NullConsole : Console;
    env.global.console = new TestConsole(
      config.useStderr ? process.stderr : process.stdout,
      process.stderr
    );
    env.testFilePath = path;
    const moduleLoader = new ModuleLoader(config, env, resolver);
    if (config.setupFiles.length) {
      for (let i = 0; i < config.setupFiles.length; i++) {
        moduleLoader.requireModule(config.setupFiles[i]);
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
