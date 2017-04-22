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
import type {GlobalConfig} from 'types/Config';
import type TestWatcher from './TestWatcher';

const {Console, formatTestResults} = require('jest-util');
const chalk = require('chalk');
const fs = require('graceful-fs');
const getMaxWorkers = require('./lib/getMaxWorkers');
const getTestPathPattern = require('./lib/getTestPathPattern');
const path = require('path');
const SearchSource = require('./SearchSource');
const setState = require('./lib/setState');
const TestRunner = require('./TestRunner');
const TestSequencer = require('./TestSequencer');

const setConfig = (contexts, newConfig) =>
  contexts.forEach(
    context => (context.config = Object.assign({}, context.config, newConfig)),
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
    return (
      chalk.bold(
        'No tests found related to files changed since last commit.\n',
      ) +
      chalk.dim(
        pattern.watch
          ? 'Press `a` to run all tests, or run Jest with `--watchAll`.'
          : 'Run Jest without `-o` to run all tests.',
      )
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
  return (
    chalk.bold('No tests found') +
    '\n' +
    individualResults.join('\n') +
    '\n' +
    `Pattern: ${chalk.yellow(testPathPattern)} - 0 matches`
  );
};

const getTestPaths = async (globalConfig, context, pattern, argv, pipe) => {
  const source = new SearchSource(context);
  let data = await source.getTestPaths(pattern);
  if (!data.tests.length) {
    if (pattern.onlyChanged && data.noSCM) {
      if (globalConfig.watch) {
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
  globalConfig: GlobalConfig,
  contexts: Array<Context>,
  argv: Object,
  pipe: stream$Writable | tty$WriteStream,
  testWatcher: TestWatcher,
  startRun: () => *,
  onComplete: (testResults: any) => void,
) => {
  const maxWorkers = getMaxWorkers(argv);
  const pattern = getTestPathPattern(argv);
  const sequencer = new TestSequencer();
  let allTests = [];
  const testRunData = await Promise.all(
    contexts.map(async context => {
      const matches = await getTestPaths(
        globalConfig,
        context,
        pattern,
        argv,
        pipe,
      );
      allTests = allTests.concat(matches.tests);
      return {context, matches};
    }),
  );

  allTests = sequencer.sort(allTests);
  if (!allTests.length) {
    new Console(pipe, pipe).log(getNoTestsFoundMessage(testRunData, pattern));
  } else if (
    allTests.length === 1 &&
    globalConfig.silent !== true &&
    globalConfig.verbose !== false
  ) {
    // $FlowFixMe
    globalConfig = Object.freeze(
      Object.assign({}, globalConfig, {verbose: true}),
    );
  }

  // When using more than one context, make all printed paths relative to the
  // current cwd.
  if (contexts.length > 1) {
    setConfig(contexts, {rootDir: process.cwd()});
  }

  const results = await new TestRunner(globalConfig, {
    maxWorkers,
    pattern,
    startRun,
    testNamePattern: argv.testNamePattern,
    testPathPattern: formatTestPathPattern(pattern),
  }).runTests(allTests, testWatcher);

  sequencer.cacheResults(allTests, results);

  return processResults(results, {
    isJSON: argv.json,
    onComplete,
    outputFile: argv.outputFile,
    testResultsProcessor: globalConfig.testResultsProcessor,
  });
};

module.exports = runJest;
