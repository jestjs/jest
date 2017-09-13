/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {GlobalConfig} from 'types/Config';
import type {Context} from 'types/Context';
import type ReporterDispatcher from './reporter_dispatcher';

import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import getChangedFilesPromise from './get_changed_files_promise';
import {replacePathSepForRegex} from 'jest-regex-util';
import HasteMap from 'jest-haste-map';
import isCI from 'is-ci';
import isValidPath from './lib/is_valid_path';
import {print as preRunMessagePrint} from './pre_run_message';
import createContext from './lib/create_context';
import runJest from './run_jest';
import updateGlobalConfig from './lib/update_global_config';
import SearchSource from './search_source';
import TestWatcher from './test_watcher';
import Prompt from './lib/Prompt';
import TestPathPatternPrompt from './test_path_pattern_prompt';
import TestNamePatternPrompt from './test_name_pattern_prompt';
import {KEYS, CLEAR} from './constants';

const isInteractive = process.stdout.isTTY && !isCI;
let hasExitListener = false;

export default function watch({
  globalConfig: initialGlobalConfig,
  contexts,
  outputStream,
  hasteMapInstances,
  stdin,
  reporterDispatcher,
}: {
  globalConfig: GlobalConfig,
  contexts: Array<Context>,
  outputStream: stream$Writable | tty$WriteStream,
  hasteMapInstances: Array<HasteMap>,
  stdin?: stream$Readable | tty$ReadStream,
  reporterDispatcher: ReporterDispatcher,
}) {
  // `globalConfig` will be consantly updated and reassigned as a result of
  // watch mode interactions.
  let globalConfig = initialGlobalConfig;
  if (!stdin) {
    stdin = process.stdin;
  }

  globalConfig = updateGlobalConfig(globalConfig, {
    mode: globalConfig.watch ? 'watch' : 'watchAll',
  });

  const prompt = new Prompt();
  const testPathPatternPrompt = new TestPathPatternPrompt(outputStream, prompt);
  const testNamePatternPrompt = new TestNamePatternPrompt(outputStream, prompt);
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
        return isValidPath(globalConfig, contexts[index].config, filePath);
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
        startRun(globalConfig);
      }
    });
  });

  if (!hasExitListener) {
    hasExitListener = true;
    process.on('exit', () => {
      if (prompt.isEntering()) {
        outputStream.write(ansiEscapes.cursorDown());
        outputStream.write(ansiEscapes.eraseDown);
      }
    });
  }

  const startRun = (globalConfig: GlobalConfig) => {
    if (isRunning) {
      return null;
    }

    testWatcher = new TestWatcher({isWatchMode: true});
    isInteractive && outputStream.write(CLEAR);
    preRunMessagePrint(outputStream);
    isRunning = true;
    const configs = contexts.map(context => context.config);
    const changedFilesPromise = getChangedFilesPromise(globalConfig, configs);
    return runJest({
      changedFilesPromise,
      contexts,
      globalConfig,
      onComplete: results => {
        isRunning = false;
        hasSnapshotFailure = !!results.snapshot.failure;
        // Create a new testWatcher instance so that re-runs won't be blocked.
        // The old instance that was passed to Jest will still be interrupted
        // and prevent test runs from the previous run.
        testWatcher = new TestWatcher({isWatchMode: true});
        if (shouldDisplayWatchUsage) {
          outputStream.write(usage(globalConfig, hasSnapshotFailure));
          shouldDisplayWatchUsage = false; // hide Watch Usage after first run
          isWatchUsageDisplayed = true;
        } else {
          outputStream.write(showToggleUsagePrompt());
          shouldDisplayWatchUsage = false;
          isWatchUsageDisplayed = false;
        }

        testNamePatternPrompt.updateCachedTestResults(results.testResults);
      },
      outputStream,
      reporterDispatcher,
      startRun,
      testWatcher,
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
        startRun(globalConfig);
        break;
      case KEYS.U:
        globalConfig = updateGlobalConfig(globalConfig, {
          updateSnapshot: 'all',
        });
        startRun(globalConfig);
        globalConfig = updateGlobalConfig(globalConfig, {
          // updateSnapshot is not sticky after a run.
          updateSnapshot: 'none',
        });
        break;
      case KEYS.A:
        globalConfig = updateGlobalConfig(globalConfig, {
          mode: 'watchAll',
          testNamePattern: '',
          testPathPattern: '',
        });
        startRun(globalConfig);
        break;
      case KEYS.C:
        globalConfig = updateGlobalConfig(globalConfig, {
          mode: 'watch',
          testNamePattern: '',
          testPathPattern: '',
        });
        startRun(globalConfig);
        break;
      case KEYS.O:
        globalConfig = updateGlobalConfig(globalConfig, {
          mode: 'watch',
          testNamePattern: '',
          testPathPattern: '',
        });
        startRun(globalConfig);
        break;
      case KEYS.P:
        testPathPatternPrompt.run(
          testPathPattern => {
            globalConfig = updateGlobalConfig(globalConfig, {
              mode: 'watch',
              testNamePattern: '',
              testPathPattern: replacePathSepForRegex(testPathPattern),
            });

            startRun(globalConfig);
          },
          onCancelPatternPrompt,
          {header: activeFilters(globalConfig)},
        );
        break;
      case KEYS.T:
        testNamePatternPrompt.run(
          testNamePattern => {
            globalConfig = updateGlobalConfig(globalConfig, {
              mode: 'watch',
              testNamePattern,
              testPathPattern: globalConfig.testPathPattern,
            });

            startRun(globalConfig);
          },
          onCancelPatternPrompt,
          {header: activeFilters(globalConfig)},
        );
        break;
      case KEYS.QUESTION_MARK:
        break;
      case KEYS.W:
        if (!shouldDisplayWatchUsage && !isWatchUsageDisplayed) {
          outputStream.write(ansiEscapes.cursorUp());
          outputStream.write(ansiEscapes.eraseDown);
          outputStream.write(usage(globalConfig, hasSnapshotFailure));
          isWatchUsageDisplayed = true;
          shouldDisplayWatchUsage = false;
        }
        break;
    }
  };

  const onCancelPatternPrompt = () => {
    outputStream.write(ansiEscapes.cursorHide);
    outputStream.write(ansiEscapes.clearScreen);
    outputStream.write(usage(globalConfig, hasSnapshotFailure));
    outputStream.write(ansiEscapes.cursorShow);
  };

  if (typeof stdin.setRawMode === 'function') {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('hex');
    stdin.on('data', onKeypress);
  }

  startRun(globalConfig);
  return Promise.resolve();
}

const activeFilters = (globalConfig: GlobalConfig, delimiter = '\n') => {
  const {testNamePattern, testPathPattern} = globalConfig;
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

const usage = (globalConfig, snapshotFailure, delimiter = '\n') => {
  const messages = [
    activeFilters(globalConfig),

    globalConfig.testPathPattern || globalConfig.testNamePattern
      ? chalk.dim(' \u203A Press ') + 'c' + chalk.dim(' to clear filters.')
      : null,
    '\n' + chalk.bold('Watch Usage'),

    globalConfig.watch
      ? chalk.dim(' \u203A Press ') + 'a' + chalk.dim(' to run all tests.')
      : null,

    (globalConfig.watchAll ||
      globalConfig.testPathPattern ||
      globalConfig.testNamePattern) &&
    !globalConfig.noSCM
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
