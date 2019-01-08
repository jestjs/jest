/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Context} from 'types/Context';
import type {ChangedFilesPromise} from 'types/ChangedFiles';
import type {GlobalConfig} from 'types/Config';
import type {AggregatedResult} from 'types/TestResult';
import type {JestHookEmitter} from 'types/JestHooks';
import type TestWatcher from './TestWatcher';

import micromatch from 'micromatch';
import chalk from 'chalk';
import path from 'path';
import {Console, formatTestResults} from 'jest-util';
import exit from 'exit';
import fs from 'graceful-fs';
import getNoTestsFoundMessage from './getNoTestsFoundMessage';
import runGlobalHook from './runGlobalHook';
import SearchSource from './SearchSource';
import TestScheduler from './TestScheduler';
import TestSequencer from './TestSequencer';
import {makeEmptyAggregatedTestResult} from './testResultHelpers';
import FailedTestsCache from './FailedTestsCache';
import {JestHook} from 'jest-watcher';
import collectNodeHandles from './collectHandles';

const getTestPaths = async (
  globalConfig,
  context,
  outputStream,
  changedFilesPromise,
  jestHooks,
) => {
  const source = new SearchSource(context);
  const data = await source.getTestPaths(globalConfig, changedFilesPromise);

  if (!data.tests.length && globalConfig.onlyChanged && data.noSCM) {
    new Console(outputStream, outputStream).log(
      'Jest can only find uncommitted changed files in a git or hg ' +
        'repository. If you make your project a git or hg ' +
        'repository (`git init` or `hg init`), Jest will be able ' +
        'to only run tests related to files changed since the last ' +
        'commit.',
    );
  }

  const shouldTestArray = await Promise.all(
    data.tests.map(test =>
      jestHooks.shouldRunTestSuite({
        config: test.context.config,
        duration: test.duration,
        testPath: test.path,
      }),
    ),
  );

  const filteredTests = data.tests.filter((test, i) => shouldTestArray[i]);

  return Object.assign({}, data, {
    allTests: filteredTests.length,
    tests: filteredTests,
  });
};

const processResults = (runResults, options) => {
  const {
    outputFile,
    isJSON,
    onComplete,
    outputStream,
    testResultsProcessor,
    collectHandles,
  } = options;

  if (collectHandles) {
    runResults.openHandles = collectHandles();
  } else {
    runResults.openHandles = [];
  }

  if (testResultsProcessor) {
    /* $FlowFixMe */
    runResults = require(testResultsProcessor)(runResults);
  }
  if (isJSON) {
    if (outputFile) {
      const filePath = path.resolve(process.cwd(), outputFile);

      fs.writeFileSync(filePath, JSON.stringify(formatTestResults(runResults)));
      outputStream.write(
        `Test results written to: ` +
          `${path.relative(process.cwd(), filePath)}\n`,
      );
    } else {
      process.stdout.write(JSON.stringify(formatTestResults(runResults)));
    }
  }

  return onComplete && onComplete(runResults);
};

const testSchedulerContext = {
  firstRun: true,
  previousSuccess: true,
};

export default (async function runJest({
  contexts,
  globalConfig,
  outputStream,
  testWatcher,
  jestHooks = new JestHook().getEmitter(),
  startRun,
  changedFilesPromise,
  onComplete,
  failedTestsCache,
}: {
  globalConfig: GlobalConfig,
  contexts: Array<Context>,
  outputStream: stream$Writable | tty$WriteStream,
  testWatcher: TestWatcher,
  jestHooks?: JestHookEmitter,
  startRun: (globalConfig: GlobalConfig) => *,
  changedFilesPromise: ?ChangedFilesPromise,
  onComplete: (testResults: AggregatedResult) => any,
  failedTestsCache: ?FailedTestsCache,
}) {
  const sequencer = new TestSequencer();
  let allTests = [];

  if (changedFilesPromise && globalConfig.watch) {
    const {repos} = await changedFilesPromise;
    const noSCM = Object.keys(repos).every(scm => repos[scm].size === 0);
    if (noSCM) {
      process.stderr.write(
        '\n' +
          chalk.bold('--watch') +
          ' is not supported without git/hg, please use --watchAll ' +
          '\n',
      );
      exit(1);
    }
  }

  let collectCoverageFrom = [];

  const testRunData = await Promise.all(
    contexts.map(async context => {
      const matches = await getTestPaths(
        globalConfig,
        context,
        outputStream,
        changedFilesPromise,
        jestHooks,
      );
      allTests = allTests.concat(matches.tests);

      if (matches.collectCoverageFrom) {
        collectCoverageFrom = collectCoverageFrom.concat(
          matches.collectCoverageFrom.filter(filename => {
            if (
              globalConfig.collectCoverageFrom &&
              !micromatch(
                [path.relative(globalConfig.rootDir, filename)],
                globalConfig.collectCoverageFrom,
              ).length
            ) {
              return false;
            }

            if (
              globalConfig.coveragePathIgnorePatterns &&
              globalConfig.coveragePathIgnorePatterns.some(pattern =>
                filename.match(pattern),
              )
            ) {
              return false;
            }

            return true;
          }),
        );
      }

      return {context, matches};
    }),
  );

  if (collectCoverageFrom.length) {
    // $FlowFixMe Object.assign
    const newConfig: GlobalConfig = Object.assign({}, globalConfig, {
      collectCoverageFrom,
    });
    globalConfig = Object.freeze(newConfig);
  }

  allTests = sequencer.sort(allTests);

  if (globalConfig.listTests) {
    const testsPaths = Array.from(new Set(allTests.map(test => test.path)));
    if (globalConfig.json) {
      console.log(JSON.stringify(testsPaths));
    } else {
      console.log(testsPaths.join('\n'));
    }

    onComplete && onComplete(makeEmptyAggregatedTestResult());
    return null;
  }

  if (globalConfig.onlyFailures && failedTestsCache) {
    allTests = failedTestsCache.filterTests(allTests);
    globalConfig = failedTestsCache.updateConfig(globalConfig);
  }

  if (!allTests.length) {
    const noTestsFoundMessage = getNoTestsFoundMessage(
      testRunData,
      globalConfig,
    );

    if (
      globalConfig.passWithNoTests ||
      globalConfig.findRelatedTests ||
      globalConfig.lastCommit ||
      globalConfig.onlyChanged
    ) {
      new Console(outputStream, outputStream).log(noTestsFoundMessage);
    } else {
      new Console(outputStream, outputStream).error(noTestsFoundMessage);

      exit(1);
    }
  } else if (
    allTests.length === 1 &&
    globalConfig.silent !== true &&
    globalConfig.verbose !== false
  ) {
    // $FlowFixMe Object.assign
    const newConfig: GlobalConfig = Object.assign({}, globalConfig, {
      verbose: true,
    });
    globalConfig = Object.freeze(newConfig);
  }

  let collectHandles;

  if (globalConfig.detectOpenHandles) {
    collectHandles = collectNodeHandles();
  }

  await runGlobalHook({allTests, globalConfig, moduleName: 'globalSetup'});

  const results = await new TestScheduler(
    globalConfig,
    {
      startRun,
    },
    testSchedulerContext,
  ).scheduleTests(allTests, testWatcher);

  sequencer.cacheResults(allTests, results);

  await runGlobalHook({
    allTests,
    globalConfig,
    moduleName: 'globalTeardown',
  });

  return processResults(results, {
    collectHandles,
    isJSON: globalConfig.json,
    onComplete,
    outputFile: globalConfig.outputFile,
    outputStream,
    testResultsProcessor: globalConfig.testResultsProcessor,
  });
});
