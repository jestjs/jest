/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Context} from 'types/Context';
import type {ChangedFilesPromise} from 'types/ChangedFiles';
import type {GlobalConfig} from 'types/Config';
import type {AggregatedResult} from 'types/TestResult';
import type TestWatcher from './test_watcher';

import path from 'path';
import {Console, formatTestResults} from 'jest-util';
import chalk from 'chalk';
import fs from 'graceful-fs';
import SearchSource from './search_source';
import TestRunner from './test_runner';
import TestSequencer from './test_sequencer';
import {makeEmptyAggregatedTestResult} from './test_result_helpers';

const setConfig = (contexts, newConfig) =>
  contexts.forEach(
    context =>
      (context.config = Object.freeze(
        Object.assign({}, context.config, newConfig),
      )),
  );

const getNoTestsFoundMessage = (testRunData, globalConfig) => {
  if (globalConfig.onlyChanged) {
    return (
      chalk.bold(
        'No tests found related to files changed since last commit.\n',
      ) +
      chalk.dim(
        globalConfig.watch
          ? 'Press `a` to run all tests, or run Jest with `--watchAll`.'
          : 'Run Jest without `-o` or with `--all` to run all tests.',
      )
    );
  }

  const pluralize = (word: string, count: number, ending: string) =>
    `${count} ${word}${count === 1 ? '' : ending}`;
  const individualResults = testRunData.map(testRun => {
    const stats = testRun.matches.stats || {};
    const config = testRun.context.config;
    const statsMessage = Object.keys(stats)
      .map(key => {
        if (key === 'roots' && config.roots.length === 1) {
          return null;
        }
        const value = config[key];
        if (value) {
          const matches = pluralize('match', stats[key], 'es');
          return `  ${key}: ${chalk.yellow(value)} - ${matches}`;
        }
        return null;
      })
      .filter(line => line)
      .join('\n');

    return testRun.matches.total
      ? `In ${chalk.bold(config.rootDir)}\n` +
        `  ${pluralize('file', testRun.matches.total || 0, 's')} checked.\n` +
        statsMessage
      : `No files found in ${config.rootDir}.\n` +
        `Make sure Jest's configuration does not exclude this directory.` +
        `\nTo set up Jest, make sure a package.json file exists.\n` +
        `Jest Documentation: ` +
        `facebook.github.io/jest/docs/configuration.html`;
  });
  return (
    chalk.bold('No tests found') +
    '\n' +
    individualResults.join('\n') +
    '\n' +
    `Pattern: ${chalk.yellow(globalConfig.testPathPattern)} - 0 matches`
  );
};

const getTestPaths = async (
  globalConfig,
  context,
  outputStream,
  changedFilesPromise,
) => {
  const source = new SearchSource(context);
  let data = await source.getTestPaths(globalConfig, changedFilesPromise);
  if (!data.tests.length) {
    if (globalConfig.onlyChanged && data.noSCM) {
      if (globalConfig.watch) {
        data = await source.getTestPaths(globalConfig);
      } else {
        new Console(outputStream, outputStream).log(
          'Jest can only find uncommitted changed files in a git or hg ' +
            'repository. If you make your project a git or hg ' +
            'repository (`git init` or `hg init`), Jest will be able ' +
            'to only run tests related to files changed since the last ' +
            'commit.',
        );
      }
    }
  }
  return data;
};

const processResults = (runResults, options) => {
  const {outputFile} = options;
  if (options.testResultsProcessor) {
    /* $FlowFixMe */
    runResults = require(options.testResultsProcessor)(runResults);
  }
  if (options.isJSON) {
    if (outputFile) {
      const filePath = path.resolve(process.cwd(), outputFile);

      fs.writeFileSync(filePath, JSON.stringify(formatTestResults(runResults)));
      options.stdout.write(
        `Test results written to: ` +
          `${path.relative(process.cwd(), filePath)}\n`,
      );
    } else {
      options.stdout.write(JSON.stringify(formatTestResults(runResults)));
    }
  }
  return options.onComplete && options.onComplete(runResults);
};

const runJest = async ({
  contexts,
  globalConfig,
  outputStream,
  testWatcher,
  startRun,
  changedFilesPromise,
  onComplete,
  stdout,
}: {
  globalConfig: GlobalConfig,
  contexts: Array<Context>,
  outputStream: stream$Writable | tty$WriteStream,
  testWatcher: TestWatcher,
  startRun: (globalConfig: GlobalConfig) => *,
  changedFilesPromise: ?ChangedFilesPromise,
  onComplete: (testResults: AggregatedResult) => any,
  stdout: stream$Writable | tty$WriteStream,
}) => {
  const sequencer = new TestSequencer();
  let allTests = [];
  const testRunData = await Promise.all(
    contexts.map(async context => {
      const matches = await getTestPaths(
        globalConfig,
        context,
        outputStream,
        changedFilesPromise,
      );
      allTests = allTests.concat(matches.tests);
      return {context, matches};
    }),
  );

  allTests = sequencer.sort(allTests);

  if (globalConfig.listTests) {
    stdout.write(JSON.stringify(allTests.map(test => test.path)));
    onComplete && onComplete(makeEmptyAggregatedTestResult());
    return null;
  }

  if (!allTests.length) {
    new Console(outputStream, outputStream).log(
      getNoTestsFoundMessage(testRunData, globalConfig),
    );
  } else if (
    allTests.length === 1 &&
    globalConfig.silent !== true &&
    globalConfig.verbose !== false
  ) {
    globalConfig = Object.freeze(
      Object.assign({}, globalConfig, {verbose: true}),
    );
  }

  // When using more than one context, make all printed paths relative to the
  // current cwd. rootDir is only used as a token during normalization and
  // has no special meaning afterwards except for printing information to the
  // CLI.
  setConfig(contexts, {rootDir: process.cwd()});

  const results = await new TestRunner(globalConfig, {
    startRun,
  }).runTests(allTests, testWatcher);

  sequencer.cacheResults(allTests, results);

  return processResults(results, {
    isJSON: globalConfig.json,
    onComplete,
    outputFile: globalConfig.outputFile,
    stdout,
    testResultsProcessor: globalConfig.testResultsProcessor,
  });
};

module.exports = runJest;
