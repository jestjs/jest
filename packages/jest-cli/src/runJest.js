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

import type {Config} from 'types/Config';
import type {Context} from 'types/Context';
import type {PatternInfo} from './SearchSource';

const fs = require('graceful-fs');

const SearchSource = require('./SearchSource');
const TestRunner = require('./TestRunner');
const TestSequencer = require('./TestSequencer');

const getTestPathPatternInfo = require('./lib/getTestPathPatternInfo');
const chalk = require('chalk');
const {Console, formatTestResults} = require('jest-util');
const getMaxWorkers = require('./lib/getMaxWorkers');
const path = require('path');
const setState = require('./lib/setState');

const getTestSummary = (argv: Object, patternInfo: PatternInfo) => {
  const testPathPattern = SearchSource.getTestPathPattern(patternInfo);
  const testInfo = patternInfo.onlyChanged
    ? chalk.dim(' related to changed files')
    : patternInfo.input !== '' ? chalk.dim(' matching ') + testPathPattern : '';

  const nameInfo = argv.testNamePattern
    ? chalk.dim(' with tests matching ') + `"${argv.testNamePattern}"`
    : '';

  return chalk.dim('Ran all test suites') +
    testInfo +
    nameInfo +
    chalk.dim('.');
};

const runJest = async (
  hasteContext: Context,
  config: Config,
  argv: Object,
  pipe: stream$Writable | tty$WriteStream,
  testWatcher: any,
  startRun: () => *,
  onComplete: (testResults: any) => void,
) => {
  const maxWorkers = getMaxWorkers(argv);
  const source = new SearchSource(hasteContext, config);
  let patternInfo = getTestPathPatternInfo(argv);

  const processTests = data => {
    if (!data.paths.length) {
      const localConsole = new Console(pipe, pipe);
      if (patternInfo.onlyChanged && data.noSCM) {
        if (config.watch) {
          // Run all the tests
          setState(argv, 'watchAll', {
            noSCM: true,
          });
          patternInfo = getTestPathPatternInfo(argv);
          return source.getTestPaths(patternInfo);
        } else {
          localConsole.log(
            'Jest can only find uncommitted changed files in a git or hg ' +
              'repository. If you make your project a git or hg ' +
              'repository (`git init` or `hg init`), Jest will be able ' +
              'to only run tests related to files changed since the last ' +
              'commit.',
          );
        }
      }

      localConsole.log(
        source.getNoTestsFoundMessage(patternInfo, config, data),
      );
    }

    if (
      data.paths.length === 1 &&
      config.silent !== true &&
      config.verbose !== false
    ) {
      // $FlowFixMe
      config = Object.assign({}, config, {verbose: true});
    }

    return data;
  };

  const runTests = async tests =>
    new TestRunner(
      hasteContext,
      config,
      {
        getTestSummary: () => getTestSummary(argv, patternInfo),
        maxWorkers,
      },
      startRun,
    ).runTests(tests, testWatcher);

  const processResults = runResults => {
    if (config.testResultsProcessor) {
      /* $FlowFixMe */
      runResults = require(config.testResultsProcessor)(runResults);
    }
    if (argv.json) {
      if (argv.outputFile) {
        const outputFile = path.resolve(process.cwd(), argv.outputFile);

        fs.writeFileSync(
          outputFile,
          JSON.stringify(formatTestResults(runResults)),
        );
        process.stdout.write(
          `Test results written to: ` +
            `${path.relative(process.cwd(), outputFile)}\n`,
        );
      } else {
        process.stdout.write(JSON.stringify(formatTestResults(runResults)));
      }
    }
    return onComplete && onComplete(runResults);
  };

  const data = await source.getTestPaths(patternInfo);
  processTests(data);
  const sequencer = new TestSequencer(config);
  const tests = sequencer.sort(data.paths);
  const results = await runTests(tests);
  sequencer.cacheResults(tests, results);
  return processResults(results);
};

module.exports = runJest;
