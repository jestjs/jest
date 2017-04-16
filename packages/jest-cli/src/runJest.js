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
import type TestWatcher from './TestWatcher';

const fs = require('graceful-fs');

const SearchSource = require('./SearchSource');
const TestRunner = require('./TestRunner');
const TestSequencer = require('./TestSequencer');

const getTestPathPattern = require('./lib/getTestPathPattern');
const chalk = require('chalk');
const {Console, formatTestResults} = require('jest-util');
const getMaxWorkers = require('./lib/getMaxWorkers');
const path = require('path');
const setState = require('./lib/setState');

const setConfig = (contexts, newConfig) =>
  contexts.forEach(
    context => context.config = Object.assign({}, context.config, newConfig),
  );

const formatTestPathPattern = pattern => {
  const testPattern = pattern.testPathPattern;
  const input = pattern.input;
  const formattedPattern = `/${testPattern || ''}/`;
  const formattedInput = pattern.shouldTreatInputAsPattern
    ? `/${input || ''}/`
    : `"${input || ''}"`;
  return input === testPattern ? formattedInput : formattedPattern;
};

const getNoTestsFoundMessage = (testRunData, pattern) => {
  if (pattern.onlyChanged) {
    return chalk.bold(
      'No tests found related to files changed since last commit.\n',
    ) +
      chalk.dim(
        pattern.watch
          ? 'Press `a` to run all tests, or run Jest with `--watchAll`.'
          : 'Run Jest without `-o` to run all tests.',
      );
  }

  const pluralize = (word: string, count: number, ending: string) =>
    `${count} ${word}${count === 1 ? '' : ending}`;
  const testPathPattern = formatTestPathPattern(pattern);
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
  return chalk.bold('No tests found') +
    '\n' +
    individualResults.join('\n') +
    '\n' +
    `Pattern: ${chalk.yellow(testPathPattern)} - 0 matches`;
};

const getTestPaths = async (context, pattern, argv, pipe) => {
  const source = new SearchSource(context);
  let data = await source.getTestPaths(pattern);
  if (!data.tests.length) {
    if (pattern.onlyChanged && data.noSCM) {
      if (context.config.watch) {
        // Run all the tests
        setState(argv, 'watchAll', {
          noSCM: true,
        });
        pattern = getTestPathPattern(argv);
        data = await source.getTestPaths(pattern);
      } else {
        new Console(pipe, pipe).log(
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
  if (options.testResultsProcessor) {
    /* $FlowFixMe */
    runResults = require(options.testResultsProcessor)(runResults);
  }
  if (options.isJSON) {
    if (options.outputFile) {
      const outputFile = path.resolve(process.cwd(), options.outputFile);

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
  return options.onComplete && options.onComplete(runResults);
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
      const matches = await getTestPaths(context, pattern, argv, pipe);
      const sequencer = new TestSequencer(context);
      const tests = sequencer.sort(matches.tests);
      return {context, matches, sequencer, tests};
    }),
  );

  const allTests = testRunData
    .reduce((tests, testRun) => tests.concat(testRun.tests), [])
    .sort((a: Test, b: Test) => {
      if (a.duration != null && b.duration != null) {
        return a.duration < b.duration ? 1 : -1;
      }
      return a.duration == null ? 1 : 0;
    });

  if (!allTests.length) {
    new Console(pipe, pipe).log(getNoTestsFoundMessage(testRunData, pattern));
  }

  if (
    allTests.length === 1 &&
    context.config.silent !== true &&
    context.config.verbose !== false
  ) {
    setConfig(contexts, {verbose: true});
  }

  if (context.config.updateSnapshot === true) {
    setConfig(contexts, {updateSnapshot: true});
  }

  // When using more than one context, make all printed paths relative to the
  // current cwd.
  if (contexts.length > 1) {
    setConfig(contexts, {rootDir: process.cwd()});
  }

  const results = await new TestRunner(context.config, {
    maxWorkers,
    pattern,
    startRun,
    testNamePattern: argv.testNamePattern,
    testPathPattern: formatTestPathPattern(pattern),
  }).runTests(allTests, testWatcher);

  testRunData.forEach(({sequencer, tests}) =>
    sequencer.cacheResults(tests, results));

  return processResults(results, {
    isJSON: argv.json,
    onComplete,
    outputFile: argv.outputFile,
    testResultsProcessor: context.config.testResultsProcessor,
  });
};

module.exports = runJest;
