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

import type {EnvironmentClass} from 'types/Environment';
import type {GlobalConfig, Path, ProjectConfig} from 'types/Config';
import type {Resolver} from 'types/Resolve';
import type {TestFramework} from 'types/TestRunner';
import type {TestResult} from 'types/TestResult';
import type RuntimeClass from 'jest-runtime';

const fs = require('fs');
const {Console, NullConsole, setGlobal} = require('jest-util');
const {getTestEnvironment} = require('jest-config');
const docblock = require('jest-docblock');

const BufferedConsole = require('./lib/BufferedConsole');
const getConsoleOutput = require('./reporters/getConsoleOutput');

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
  const TestConsole = globalConfig.verbose
    ? Console
    : globalConfig.silent ? NullConsole : BufferedConsole;
  const testConsole = new TestConsole(
    globalConfig.useStderr ? process.stderr : process.stdout,
    process.stderr,
    (type, message) =>
      getConsoleOutput(
        config.rootDir,
        !!globalConfig.verbose,
        // 4 = the console call is buried 4 stack frames deep
        BufferedConsole.write([], type, message, 4),
      ),
  );
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
