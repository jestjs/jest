/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Argv} from 'types/Argv';
import type {GlobalConfig} from 'types/Config';
import type {Context} from 'types/Context';

import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import {replacePathSepForRegex} from 'jest-regex-util';
import {getFailedSnapshotTests} from 'jest-util';
import HasteMap from 'jest-haste-map';
import isCI from 'is-ci';
import isValidPath from './lib/isValidPath';
import preRunMessage from './preRunMessage';
import createContext from './lib/createContext';
import runJest from './runJest';
import updateArgv from './lib/updateArgv';
import SearchSource from './SearchSource';
import TestWatcher from './TestWatcher';
import Prompt from './lib/Prompt';
import TestPathPatternPrompt from './TestPathPatternPrompt';
import TestNamePatternPrompt from './TestNamePatternPrompt';
import {KEYS, CLEAR} from './constants';

const isInteractive = process.stdout.isTTY && !isCI;
let hasExitListener = false;

const watch = (
  initialGlobalConfig: GlobalConfig,
  contexts: Array<Context>,
  argv: Argv,
  pipe: stream$Writable | tty$WriteStream,
  hasteMapInstances: Array<HasteMap>,
  stdin?: stream$Readable | tty$ReadStream = process.stdin,
) => {
  updateArgv(argv, argv.watch ? 'watch' : 'watchAll', {
    testNamePattern: argv.testNamePattern,
    testPathPattern: argv.testPathPattern || (argv._ || []).join('|'),
  });

  const prompt = new Prompt();
  const testPathPatternPrompt = new TestPathPatternPrompt(pipe, prompt);
  const testNamePatternPrompt = new TestNamePatternPrompt(pipe, prompt);

  let failedSnapshotTestPaths = [];
  let snapshotInteractiveMode = false;

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
        return isValidPath(
          initialGlobalConfig,
          contexts[index].config,
          filePath,
        );
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
    const globalConfig = Object.freeze(
      Object.assign({}, initialGlobalConfig, overrideConfig, {
        testNamePattern: argv.testNamePattern,
        testPathPattern: argv.testPathPattern,
      }),
    );
    return runJest(
      // $FlowFixMe
      globalConfig,
      contexts,
      argv,
      pipe,
      testWatcher,
      startRun,
      results => {
        isRunning = false;
        hasSnapshotFailure = !!results.snapshot.failure;

        if (hasSnapshotFailure && !snapshotInteractiveMode) {
            failedSnapshotTestPaths = getFailedSnapshotTests(results);
        }

        // Create a new testWatcher instance so that re-runs won't be blocked.
        // The old instance that was passed to Jest will still be interrupted
        // and prevent test runs from the previous run.
        testWatcher = new TestWatcher({isWatchMode: true});
        if (shouldDisplayWatchUsage) {
          pipe.write(usage(argv, hasSnapshotFailure, snapshotInteractiveMode));
          shouldDisplayWatchUsage = false; // hide Watch Usage after first run
          isWatchUsageDisplayed = true;
        } else {
          pipe.write(showToggleUsagePrompt());
          shouldDisplayWatchUsage = false;
          isWatchUsageDisplayed = false;
        }

        testNamePatternPrompt.updateCachedTestResults(results.testResults);

        if (!hasSnapshotFailure && snapshotInteractiveMode) {
            failedSnapshotTestPaths.shift();
            updateSnapshotInteractiveTarget();
        }
      },
    ).catch(error => console.error(chalk.red(error.stack)));
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
        startRun({updateSnapshot: 'all'});
        break;
      case KEYS.I:
          if (hasSnapshotFailure && !snapshotInteractiveMode) {
              snapshotInteractiveMode = true;
          }
            updateSnapshotInteractiveTarget();

        break;
      case KEYS.A:
        snapshotInteractiveMode = false;
        updateArgv(argv, 'watchAll', {
          testNamePattern: '',
          testPathPattern: '',
        });
        startRun();
        break;
      case KEYS.C:
        updateArgv(argv, 'watch', {
          testNamePattern: '',
          testPathPattern: '',
        });
        startRun();
        break;
      case KEYS.O:
          resetAndRun();
        break;
      case KEYS.P:
        snapshotInteractiveMode = false;
        testPathPatternPrompt.run(
          testPathPattern => {
            updateArgv(argv, 'watch', {
              testNamePattern: '',
              testPathPattern: replacePathSepForRegex(testPathPattern),
            });

            startRun();
          },
          onCancelPatternPrompt,
          {header: activeFilters(argv)},
        );
        break;
      case KEYS.S:
          if (snapshotInteractiveMode) {
              failedSnapshotTestPaths.shift();
          }
          updateSnapshotInteractiveTarget();
          break;
      case KEYS.T:
        snapshotInteractiveMode = false;
        testNamePatternPrompt.run(
          testNamePattern => {
            updateArgv(argv, 'watch', {
              testNamePattern,
              testPathPattern: argv.testPathPattern,
            });

            startRun();
          },
          onCancelPatternPrompt,
          {header: activeFilters(argv)},
        );
        break;
      case KEYS.QUESTION_MARK:
        break;
      case KEYS.W:
        if (!shouldDisplayWatchUsage && !isWatchUsageDisplayed) {
          pipe.write(ansiEscapes.cursorUp());
          pipe.write(ansiEscapes.eraseDown);
          pipe.write(usage(argv, hasSnapshotFailure, snapshotInteractiveMode));
          isWatchUsageDisplayed = true;
          shouldDisplayWatchUsage = false;
        }
        break;
    }
  };

  const resetAndRun = () => {
      snapshotInteractiveMode = false;
      updateArgv(argv, 'watch', {
          testNamePattern: '',
          testPathPattern: '',
      });
      startRun();
    };

  const updateSnapshotInteractiveTarget = () => {
      if (!failedSnapshotTestPaths.length) {
          resetAndRun();
          return;
      }

      let pattern = '';
      searchSources.forEach(({context}) => {
          context.config.roots.forEach(rootPath => {
              if (failedSnapshotTestPaths[0].substr(0, rootPath.length) === rootPath) {
                  pattern = failedSnapshotTestPaths[0].substr(rootPath.length+1);
              }
          })
      });

      updateArgv(argv, 'watch', {
          testNamePattern: '',
          testPathPattern: replacePathSepForRegex(pattern),
      });

      startRun();

  };

  const onCancelPatternPrompt = () => {
    pipe.write(ansiEscapes.cursorHide);
    pipe.write(ansiEscapes.clearScreen);
    pipe.write(usage(argv, hasSnapshotFailure, snapshotInteractiveMode));
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

const activeFilters = (argv, delimiter = '\n') => {
  const {testNamePattern, testPathPattern} = argv;
  if (testNamePattern || testPathPattern) {
    const filters = [
      testPathPattern
        ? chalk.dim('filename ') + chalk.yellow('/' + testPathPattern + '/')
        : null,
      testNamePattern
        ? chalk.dim('test name ') + chalk.yellow('/' + testNamePattern + '/')
        : null,
    ]
      .filter(f => !!f)
      .join(', ');

    const messages = ['\n' + chalk.bold('Active Filters: ') + filters];

    return messages.filter(message => !!message).join(delimiter);
  }

  return '';
};

const usage = (argv, snapshotFailure, snapshotInteractiveMode, delimiter = '\n') => {
  const messages = [
    activeFilters(argv),
    argv.testPathPattern || argv.testNamePattern
      ? chalk.dim(' \u203A Press ') + 'c' + chalk.dim(' to clear filters.')
      : null,
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
    snapshotFailure && !snapshotInteractiveMode
      ? chalk.dim(' \u203A Press ') +
          'i' +
          chalk.dim(' to update failing snapshots interactively.')
      : null,
    snapshotInteractiveMode
      ? chalk.dim(' \u203A Press ') +
        's' +
        chalk.dim(' to skip.')
      : null,
    chalk.dim(' \u203A Press ') +
      'p' +
      chalk.dim(' to filter by a filename regex pattern.'),
    chalk.dim(' \u203A Press ') +
      't' +
      chalk.dim(' to filter by a test name regex pattern.'),
    chalk.dim(' \u203A Press ') + 'q' + chalk.dim(' to quit watch mode.'),
    chalk.dim(' \u203A Press ') +
      'Enter' +
      chalk.dim(' to trigger a test run.'),
  ];

  return messages.filter(message => !!message).join(delimiter) + '\n';
};

const showToggleUsagePrompt = () =>
  '\n' +
  chalk.bold('Watch Usage: ') +
  chalk.dim('Press ') +
  'w' +
  chalk.dim(' to show more.');

module.exports = watch;
