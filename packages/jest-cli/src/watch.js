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

import type {HasteContext} from 'types/HasteMap';
import type {Config} from 'types/Config';

const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');
const createHasteContext = require('./lib/createHasteContext');
const HasteMap = require('jest-haste-map');
const preRunMessage = require('./preRunMessage');
const runJest = require('./runJest');
const setState = require('./lib/setState');
const TestWatcher = require('./TestWatcher');
const PromptController = require('./lib/PromptController');
const TestPathPatternModeController = require('./TestPathPatternModeController');
const TestNamePatternModeController = require('./TestNamePatternModeController');
const {KEYS, CLEAR} = require('./constants');

const SNAPSHOT_EXTENSION = 'snap';

const watch = (
  config: Config,
  pipe: stream$Writable | tty$WriteStream,
  argv: Object,
  hasteMap: HasteMap,
  hasteContext: HasteContext,
  stdin?: stream$Readable | tty$ReadStream = process.stdin
) => {
  setState(argv, argv.watch ? 'watch' : 'watchAll', {
    testNamePattern: argv.testNamePattern,
    testPathPattern: argv.testPathPattern
      || argv._ instanceof Array
        ? argv._.join('|')
        : '',
  });

  let hasSnapshotFailure = false;
  let isRunning = false;
  let testWatcher;
  let displayHelp = true;

  const promptController = new PromptController();

  const testPathPatternModeController = TestPathPatternModeController(
    config,
    pipe,
    promptController,
  );

  testPathPatternModeController.updateSearchSource(hasteContext);

  const testNamePatternModeController = TestNamePatternModeController(
    config,
    pipe,
    promptController,
  );

  hasteMap.on('change', ({eventsQueue, hasteFS, moduleMap}) => {
    const hasOnlySnapshotChanges = eventsQueue.every(({filePath}) => {
      return filePath.endsWith(`.${SNAPSHOT_EXTENSION}`);
    });

    if (!hasOnlySnapshotChanges) {
      hasteContext =  createHasteContext(config, {hasteFS, moduleMap});
      promptController.abort();
      testPathPatternModeController.updateSearchSource(hasteContext);
      startRun();
    }
  });

  process.on('exit', () => {
    if (promptController.entering) {
      pipe.write(ansiEscapes.cursorDown());
      pipe.write(ansiEscapes.eraseDown);
    }
  });

  const startRun = (overrideConfig: Object = {}) => {
    if (isRunning) {
      return null;
    }

    testWatcher = new TestWatcher({isWatchMode: true});
    pipe.write(CLEAR);
    preRunMessage.print(pipe);
    isRunning = true;
    return runJest(
      hasteContext,
      // $FlowFixMe
      Object.freeze(Object.assign({
        testNamePattern: argv.testNamePattern,
        testPathPattern: argv.testPathPattern,
      }, config, overrideConfig)),
      argv,
      pipe,
      testWatcher,
      startRun,
      results => {
        isRunning = false;
        hasSnapshotFailure = !!results.snapshot.failure;
        // Create a new testWatcher instance so that re-runs won't be blocked.
        // The old instance that was passed to Jest will still be interrupted
        // and prevent test runs from the previous run.
        testWatcher = new TestWatcher({isWatchMode: true});
        if (displayHelp) {
          pipe.write(usage(argv, hasSnapshotFailure));
          displayHelp = !process.env.JEST_HIDE_USAGE;
        }

        testNamePatternModeController.updateCachedTestNames(
          results.testResults
        );
      },
    ).then(
      () => {},
      error => console.error(chalk.red(error.stack)),
    );
  };

  const onKeypress = (key: string) => {
    if (key === KEYS.CONTROL_C || key === KEYS.CONTROL_D) {
      process.exit(0);
      return;
    }

    if (promptController.entering) {
      promptController.put(key);
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
        testPathPatternModeController.run(
          testPathPattern => {
            setState(argv, 'watch', {
              testNamePattern: '',
              testPathPattern,
            });

            startRun();
          },
          () => {
            pipe.write(ansiEscapes.cursorHide);
            pipe.write(ansiEscapes.clearScreen);
            pipe.write(usage(argv, hasSnapshotFailure));
            pipe.write(ansiEscapes.cursorShow);
          },
        );
        break;
      case KEYS.T:
        testNamePatternModeController.run(
          testNamePattern => {
            setState(argv, 'watch', {
              testNamePattern,
              testPathPattern: '',
            });

            startRun();
          },
          () => {
            pipe.write(ansiEscapes.cursorHide);
            pipe.write(ansiEscapes.clearScreen);
            pipe.write(usage(argv, hasSnapshotFailure));
            pipe.write(ansiEscapes.cursorShow);
          },
        );
        break;
      case KEYS.QUESTION_MARK:
        if (process.env.JEST_HIDE_USAGE) {
          pipe.write(usage(argv, hasSnapshotFailure));
        }
        break;
    }
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

const usage = (
  argv,
  snapshotFailure,
  delimiter = '\n',
) => {
  /* eslint-disable max-len */
  const messages = [
    '\n' + chalk.bold('Watch Usage'),
    argv.watch
      ? chalk.dim(' \u203A Press ') + 'a' + chalk.dim(' to run all tests.')
      : null,
    (argv.watchAll || argv.testPathPattern || argv.testNamePattern) && !argv.noSCM
      ? chalk.dim(' \u203A Press ') + 'o' + chalk.dim(' to only run tests related to changed files.')
      : null,
    snapshotFailure
      ? chalk.dim(' \u203A Press ') + 'u' + chalk.dim(' to update failing snapshots.')
      : null,
    chalk.dim(' \u203A Press ') + 'p' + chalk.dim(' to filter by a filename regex pattern.'),
    chalk.dim(' \u203A Press ') + 't' + chalk.dim(' to filter by a test name regex pattern.'),
    chalk.dim(' \u203A Press ') + 'q' + chalk.dim(' to quit watch mode.'),
    chalk.dim(' \u203A Press ') + 'Enter' + chalk.dim(' to trigger a test run.'),
  ];
  /* eslint-enable max-len */
  return messages.filter(message => !!message).join(delimiter) + '\n';
};

module.exports = watch;
