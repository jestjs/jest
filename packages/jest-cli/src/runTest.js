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
import type {TestResult} from 'types/TestResult';
import type {Resolver} from 'types/Resolve';

const BufferedConsole = require('./lib/BufferedConsole');
const {
  Console,
  NullConsole,
  setGlobal,
} = require('jest-util');
const getConsoleOutput = require('./reporters/getConsoleOutput');

function runTest(path: Path, config: Config, resolver: Resolver) {
  /* $FlowFixMe */
  const TestEnvironment = require(config.testEnvironment);
  /* $FlowFixMe */
  const TestRunner = require(config.testRunner);
  /* $FlowFixMe */
  const ModuleLoader = require(config.moduleLoader || 'jest-runtime');

  const env = new TestEnvironment(config);
  const TestConsole =
    config.verbose
      ? Console
      : (config.silent
        ? NullConsole
        : BufferedConsole
      );
  const testConsole = new TestConsole(
    config.useStderr ? process.stderr : process.stdout,
    process.stderr,
    (type, message) => getConsoleOutput(
      config.rootDir,
      !!config.verbose,
      // 4 = the console call is burried 4 stack frames deep
      BufferedConsole.write([], type, message, 4),
    ),
  );
  setGlobal(env.global, 'console', testConsole);
  const runtime = new ModuleLoader(config, env, resolver);
  const start = Date.now();
  return TestRunner(config, env, runtime, path)
    .then((result: TestResult) => {
      const testCount =
        result.numPassingTests +
        result.numFailingTests +
        result.numPendingTests;
      result.perfStats = {end: Date.now(), start};
      result.testFilePath = path;
      result.coverage = runtime.getAllCoverageInfo();
      result.sourceMaps = runtime.getSourceMapInfo();
      result.console = testConsole.getBuffer();
      result.skipped = testCount === result.numPendingTests;
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

        // Delay the resolution to allow log messages to be output.
        return new Promise(resolve => setImmediate(() => resolve(result)));
      }),
      err => Promise.resolve().then(() => {
        env.dispose();
        throw err;
      }),
    );
}

module.exports = runTest;
