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

import type {Context} from 'types/Context';
import type {Test} from 'types/TestRunner';
import type {PatternInfo} from './SearchSource';
import type TestWatcher from './TestWatcher';

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

const getTestPaths = async (context, patternInfo, argv, pipe) => {
  const source = new SearchSource(context, context.config);
  let data = await source.getTestPaths(patternInfo);
  if (!data.paths.length) {
    const localConsole = new Console(pipe, pipe);
    if (patternInfo.onlyChanged && data.noSCM) {
      if (context.config.watch) {
        // Run all the tests
        setState(argv, 'watchAll', {
          noSCM: true,
        });
        patternInfo = getTestPathPatternInfo(argv);
        data = await source.getTestPaths(patternInfo);
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
      source.getNoTestsFoundMessage(patternInfo, context.config, data),
    );
  }

  return {
    data,
    patternInfo,
  };
};

const runJest = async (
  contexts: Array<Context>,
  argv: Object,
  pipe: stream$Writable | tty$WriteStream,
  testWatcher: TestWatcher,
  startRun: () => *,
  onComplete: (testResults: any) => void,
) => {
  const maxWorkers = getMaxWorkers(argv);
  const context = contexts[0];
  const testRunData = await Promise.all(
    contexts.map(async context => {
      const {data, patternInfo} = await getTestPaths(
        context,
        getTestPathPatternInfo(argv),
        argv,
        pipe,
      );

      const sequencer = new TestSequencer(context);
      const tests = sequencer.sort(data.paths);
      return {context, patternInfo, sequencer, tests};
    }),
  );

  const processResults = runResults => {
    if (context.config.testResultsProcessor) {
      /* $FlowFixMe */
      runResults = require(context.config.testResultsProcessor)(runResults);
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

  const allTests = testRunData
    .reduce((tests, testRun) => tests.concat(testRun.tests), [])
    .sort((a: Test, b: Test) => {
      if (a.duration != null && b.duration != null) {
        return a.duration < b.duration ? 1 : -1;
      }
      return a.duration == null ? 1 : 0;
    });

  if (
    allTests.length === 1 &&
    context.config.silent !== true &&
    context.config.verbose !== false
  ) {
    context.config = Object.assign({}, context.config, {verbose: true});
  }

  if (context.config.updateSnapshot === true) {
     context.config = Object.assign({}, context.config, {
      updateSnapshot: true,
    });
  }

  const results = await new TestRunner(
    context,
    context.config,
    {
      getTestSummary: () => getTestSummary(argv, testRunData[0].patternInfo),
      maxWorkers,
    },
    startRun,
  ).runTests(allTests, testWatcher);
  testRunData.forEach(({sequencer, tests}) =>
    sequencer.cacheResults(tests, results));
  return processResults(results);
};

module.exports = runJest;
