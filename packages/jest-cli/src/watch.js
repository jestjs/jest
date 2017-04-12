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

const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');
const createContext = require('./lib/createContext');
const HasteMap = require('jest-haste-map');
const isCI = require('is-ci');
const isInteractive = process.stdout.isTTY && !isCI;
const isValidPath = require('./lib/isValidPath');
const preRunMessage = require('./preRunMessage');
const runJest = require('./runJest');
const setState = require('./lib/setState');
const SearchSource = require('./SearchSource');
const TestWatcher = require('./TestWatcher');
const Prompt = require('./lib/Prompt');
const TestPathPatternPrompt = require('./TestPathPatternPrompt');
const TestNamePatternPrompt = require('./TestNamePatternPrompt');
const {KEYS, CLEAR} = require('./constants');

let hasExitListener = false;

const watch = (
  contexts: Array<Context>,
  argv: Object,
  pipe: stream$Writable | tty$WriteStream,
  hasteMapInstances: Array<HasteMap>,
  stdin?: stream$Readable | tty$ReadStream = process.stdin,
) => {
  setState(argv, argv.watch ? 'watch' : 'watchAll', {
    testNamePattern: argv.testNamePattern,
    testPathPattern: argv.testPathPattern ||
      (Array.isArray(argv._) ? argv._.join('|') : ''),
  });

  const prompt = new Prompt();
  const testPathPatternPrompt = new TestPathPatternPrompt(pipe, prompt);
  const testNamePatternPrompt = new TestNamePatternPrompt(pipe, prompt);
  let searchSources = contexts.map(context => ({
    context,
    searchSource: new SearchSource(context),
  }));
  let hasSnapshotFailure = false;
  let isRunning = false;
  let testWatcher;
  let shouldDisplayWatchUsage = true;
  let isWatchUsageDisplayed = false;

  testPathPatternPrompt.updateSearchSources(searchSources);

  hasteMapInstances.forEach((hasteMapInstance, index) => {
    hasteMapInstance.on('change', ({eventsQueue, hasteFS, moduleMap}) => {
      const validPaths = eventsQueue.filter(({filePath}) => {
        return isValidPath(contexts[index].config, filePath);
      });

      if (validPaths.length) {
        const context = (contexts[index] = createContext(
          contexts[index].config,
          {
            hasteFS,
            moduleMap,
          },
        ));
        prompt.abort();
        searchSources = searchSources.slice();
        searchSources[index] = {
          context,
          searchSource: new SearchSource(context),
        };
        testPathPatternPrompt.updateSearchSources(searchSources);
        startRun();
      }
    });
  });

  if (!hasExitListener) {
    hasExitListener = true;
    process.on('exit', () => {
      if (prompt.isEntering()) {
        pipe.write(ansiEscapes.cursorDown());
        pipe.write(ansiEscapes.eraseDown);
      }
    });
  }

  const startRun = (overrideConfig: Object = {}) => {
    if (isRunning) {
      return null;
    }

    testWatcher = new TestWatcher({isWatchMode: true});
    isInteractive && pipe.write(CLEAR);
    preRunMessage.print(pipe);
    isRunning = true;
    contexts.forEach(context => {
      // $FlowFixMe
      context.config = Object.freeze(
        // $FlowFixMe
        Object.assign(
          {
            testNamePattern: argv.testNamePattern,
            testPathPattern: argv.testPathPattern,
          },
          context.config,
          overrideConfig,
        ),
      );
    });
    return runJest(contexts, argv, pipe, testWatcher, startRun, results => {
      isRunning = false;
      hasSnapshotFailure = !!results.snapshot.failure;
      // Create a new testWatcher instance so that re-runs won't be blocked.
      // The old instance that was passed to Jest will still be interrupted
      // and prevent test runs from the previous run.
      testWatcher = new TestWatcher({isWatchMode: true});
      if (shouldDisplayWatchUsage) {
        pipe.write(usage(argv, hasSnapshotFailure));
        shouldDisplayWatchUsage = false; // hide Watch Usage after first run
        isWatchUsageDisplayed = true;
      } else {
        pipe.write(showToggleUsagePrompt());
        shouldDisplayWatchUsage = false;
        isWatchUsageDisplayed = false;
      }

      testNamePatternPrompt.updateCachedTestResults(results.testResults);
    }).catch(error => console.error(chalk.red(error.stack)));
  };

  const onKeypress = (key: string) => {
    if (key === KEYS.CONTROL_C || key === KEYS.CONTROL_D) {
      process.exit(0);
      return;
    }

    if (prompt.isEntering()) {
      prompt.put(key);
      return;
    }

    // Abort test run
    if (
      isRunning &&
      testWatcher &&
      [KEYS.Q, KEYS.ENTER, KEYS.A, KEYS.O, KEYS.P, KEYS.T].indexOf(key) !== -1
    ) {
      testWatcher.setState({interrupted: true});
      return;
    }

    switch (key) {
      case KEYS.Q:
        process.exit(0);
        return;
      case KEYS.ENTER:
        startRun();
        break;
      case KEYS.U:
        startRun({updateSnapshot: true});
        break;
      case KEYS.A:
        setState(argv, 'watchAll', {
          testNamePattern: '',
          testPathPattern: '',
        });
        startRun();
        break;
      case KEYS.O:
        setState(argv, 'watch', {
          testNamePattern: '',
          testPathPattern: '',
        });
        startRun();
        break;
      case KEYS.P:
        testPathPatternPrompt.run(
          testPathPattern => {
            setState(argv, 'watch', {
              testNamePattern: '',
              testPathPattern,
            });

            startRun();
          },
          onCancelPatternPrompt,
        );
        break;
      case KEYS.T:
        testNamePatternPrompt.run(
          testNamePattern => {
            setState(argv, 'watch', {
              testNamePattern,
              testPathPattern: '',
            });

            startRun();
          },
          onCancelPatternPrompt,
        );
        break;
      case KEYS.QUESTION_MARK:
        break;
      case KEYS.W:
        if (!shouldDisplayWatchUsage && !isWatchUsageDisplayed) {
          pipe.write(ansiEscapes.cursorUp());
          pipe.write(ansiEscapes.eraseDown);
          pipe.write(usage(argv, hasSnapshotFailure));
          isWatchUsageDisplayed = true;
          shouldDisplayWatchUsage = false;
        }
        break;
    }
  };

  const onCancelPatternPrompt = () => {
    pipe.write(ansiEscapes.cursorHide);
    pipe.write(ansiEscapes.clearScreen);
    pipe.write(usage(argv, hasSnapshotFailure));
    pipe.write(ansiEscapes.cursorShow);
  };

  if (typeof stdin.setRawMode === 'function') {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('hex');
    stdin.on('data', onKeypress);
  }

  startRun();
  return Promise.resolve();
};

const usage = (argv, snapshotFailure, delimiter = '\n') => {
  /* eslint-disable max-len */
  const messages = [
    '\n' + chalk.bold('Watch Usage'),
    argv.watch
      ? chalk.dim(' \u203A Press ') + 'a' + chalk.dim(' to run all tests.')
      : null,
    (argv.watchAll || argv.testPathPattern || argv.testNamePattern) &&
      !argv.noSCM
      ? chalk.dim(' \u203A Press ') +
          'o' +
          chalk.dim(' to only run tests related to changed files.')
      : null,
    snapshotFailure
      ? chalk.dim(' \u203A Press ') +
          'u' +
          chalk.dim(' to update failing snapshots.')
      : null,
    chalk.dim(' \u203A Press ') +
      'p' +
      chalk.dim(' to filter by a filename regex pattern.'),
    chalk.dim(' \u203A Press ') + 'q' + chalk.dim(' to quit watch mode.'),
    chalk.dim(' \u203A Press ') +
      'Enter' +
      chalk.dim(' to trigger a test run.'),
  ];
  /* eslint-enable max-len */
  return messages.filter(message => !!message).join(delimiter) + '\n';
};

const showToggleUsagePrompt = () =>
  '\n' +
  chalk.bold('Watch Usage: ') +
  chalk.dim('Press ') +
  'w' +
  chalk.dim(' to show more.');

module.exports = watch;
