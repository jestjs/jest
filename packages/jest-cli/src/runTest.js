/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {EnvironmentClass} from 'types/Environment';
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Resolver} from 'types/Resolve';
import type {TestFramework} from 'types/TestRunner';
import type {TestResult} from 'types/TestResult';
import type RuntimeClass from 'jest-runtime';

import fs from 'fs';
import {Console, NullConsole, setGlobal} from 'jest-util';
import {getTestEnvironment} from 'jest-config';
import docblock from 'jest-docblock';
import BufferedConsole from './lib/BufferedConsole';
import getConsoleOutput from './reporters/getConsoleOutput';

function runTest(
  path: Path,
  globalConfig: GlobalConfig,
  config: ProjectConfig,
  resolver: Resolver,
) {
  let testSource;

  try {
    testSource = fs.readFileSync(path, 'utf8');
  } catch (e) {
    return Promise.reject(e);
  }

  const parsedDocblock = docblock.parse(docblock.extract(testSource));
  const customEnvironment = parsedDocblock['jest-environment'];
  let testEnvironment = config.testEnvironment;

  if (customEnvironment) {
    testEnvironment = getTestEnvironment(
      Object.assign({}, config, {
        testEnvironment: customEnvironment,
      }),
    );
  }

  /* $FlowFixMe */
  const TestEnvironment = (require(testEnvironment): EnvironmentClass);
  /* $FlowFixMe */
  const testFramework = (require(config.testRunner): TestFramework);
  /* $FlowFixMe */
  const Runtime = (require(config.moduleLoader || 'jest-runtime'): Class<
    RuntimeClass,
  >);

  const environment = new TestEnvironment(config);
  const consoleOut = globalConfig.useStderr ? process.stderr : process.stdout;
  const consoleFormatter = (type, message) =>
    getConsoleOutput(
      config.rootDir,
      !!globalConfig.verbose,
      // 4 = the console call is buried 4 stack frames deep
      BufferedConsole.write([], type, message, 4),
    );

  let testConsole;
  if (globalConfig.verbose) {
    testConsole = new Console(consoleOut, process.stderr, consoleFormatter);
  } else {
    if (globalConfig.silent) {
      testConsole = new NullConsole(
        consoleOut,
        process.stderr,
        consoleFormatter,
      );
    } else {
      testConsole = new BufferedConsole();
    }
  }

  const cacheFS = {[path]: testSource};
  setGlobal(environment.global, 'console', testConsole);
  const runtime = new Runtime(config, environment, resolver, cacheFS, {
    collectCoverage: globalConfig.collectCoverage,
    collectCoverageFrom: globalConfig.collectCoverageFrom,
    collectCoverageOnlyFrom: globalConfig.collectCoverageOnlyFrom,
    mapCoverage: globalConfig.mapCoverage,
  });
  const start = Date.now();
  return testFramework(globalConfig, config, environment, runtime, path)
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
      result =>
        Promise.resolve().then(() => {
          environment.dispose();
          if (config.logHeapUsage) {
            if (global.gc) {
              global.gc();
            }
            result.memoryUsage = process.memoryUsage().heapUsed;
          }

          // Delay the resolution to allow log messages to be output.
          return new Promise(resolve => setImmediate(() => resolve(result)));
        }),
      err =>
        Promise.resolve().then(() => {
          environment.dispose();
          throw err;
        }),
    );
}

module.exports = runTest;
