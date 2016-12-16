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

import type {AggregatedResult} from 'types/TestResult';
import type {Path} from 'types/Config';
import type {PatternInfo} from './SearchSource';

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const Runtime = require('jest-runtime');
const SearchSource = require('./SearchSource');
const TestRunner = require('./TestRunner');

const {Console, clearLine} = require('jest-util');
const {formatTestResults} = require('jest-util');
const {run} = require('./cli');
const ansiEscapes = require('ansi-escapes');
const chalk = require('chalk');
const os = require('os');
const path = require('path');
const preRunMessage = require('./preRunMessage');
const readConfig = require('jest-config').readConfig;
const sane = require('sane');
const which = require('which');
const TestWatcher = require('./TestWatcher');
const {createDirectory} = require('jest-util');
const runJest = require('./runjest');
const getMaxWorkers = require('./lib/getMaxWorkers');
const setWatchMode = require('./lib/setWatchMode');

const CLEAR = process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H';
const VERSION = require('../package.json').version;
const WATCHER_DEBOUNCE = 200;
const WATCHMAN_BIN = 'watchman';
const KEYS = {
  A: '61',
  ARROW_DOWN: '1b5b42',
  ARROW_LEFT: '1b5b44',
  ARROW_RIGHT: '1b5b43',
  ARROW_UP: '1b5b41',
  BACKSPACE: process.platform === 'win32' ? '08' : '7f',
  CONTROL_C: '03',
  CONTROL_D: '04',
  ENTER: '0d',
  ESCAPE: '1b',
  O: '6f',
  P: '70',
  Q: '71',
  QUESTION_MARK: '3f',
  U: '75',
};

const getTestSummary = (
  argv: Object,
  patternInfo: PatternInfo,
) => {
  const testPathPattern = SearchSource.getTestPathPattern(patternInfo);
  const testInfo = patternInfo.onlyChanged
    ? chalk.dim(' related to changed files')
    : patternInfo.input !== ''
      ? chalk.dim(' matching ') + testPathPattern
      : '';

  const nameInfo = argv.testNamePattern
    ? chalk.dim(' with tests matching ') + `"${argv.testNamePattern}"`
    : '';

  return (
    chalk.dim('Ran all test suites') +
    testInfo +
    nameInfo +
    chalk.dim('.')
  );
};

const getWatcher = (
  config,
  packageRoot,
  callback,
  options,
) => {
  which(WATCHMAN_BIN, (err, resolvedPath) => {
    const watchman = !err && options.useWatchman && resolvedPath;
    const glob = config.moduleFileExtensions.map(ext => '**/*' + ext);
    const watcher = sane(packageRoot, {glob, watchman});
    callback(watcher);
  });
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
    (argv.watchAll || argv._) && !argv.noSCM
      ? chalk.dim(' \u203A Press ') + 'o' + chalk.dim(' to only run tests related to changed files.')
      : null,
    snapshotFailure
      ? chalk.dim(' \u203A Press ') + 'u' + chalk.dim(' to update failing snapshots.')
      : null,
    chalk.dim(' \u203A Press ') + 'p' + chalk.dim(' to filter by a filename regex pattern.'),
    chalk.dim(' \u203A Press ') + 'q' + chalk.dim(' to quit watch mode.'),
    chalk.dim(' \u203A Press ') + 'Enter' + chalk.dim(' to trigger a test run.'),
  ];
  /* eslint-enable max-len */
  return messages.filter(message => !!message).join(delimiter);
};

const getHasteMapAndHasteContext = (config, options) => {
  createDirectory(config.cacheDirectory);
  const jestHasteMap = Runtime.createHasteMap(config, {
    console: options.console,
    maxWorkers: options.maxWorkers,
    resetCache: !config.cache,
    watch: options.watch
  });

  return jestHasteMap.build().then(
    hasteMap => ({
      hasteFS: hasteMap.hasteFS,
      resolver: Runtime.createResolver(config, hasteMap.moduleMap),
    }),
    error => {
      throw error;
    },
  )
  .then(hasteMap => ({
    config,
    hasteMap,
    jestHasteMap,
  }));
}

const runCLI = (
  argv: Object,
  root: Path,
  onComplete: (results: ?AggregatedResult) => void,
) => {
  const pipe = argv.json ? process.stderr : process.stdout;
  argv = argv || {};
  if (argv.version) {
    pipe.write(`v${VERSION}\n`);
    onComplete && onComplete();
    return;
  }

  readConfig(argv, root)
    .then(config => getHasteMapAndHasteContext(config,  {
      console: new Console(pipe, pipe),
      maxWorkers: getMaxWorkers(argv),
      resetCache: !config.cache,
      watch: config.watch,
    }))
    .then(({config, jestHasteMap, hasteMap}) => {
      let hasteMapFS = hasteMap;
      if (argv.debug) {
        /* $FlowFixMe */
        const testFramework = require(config.testRunner);
        pipe.write('jest version = ' + VERSION + '\n');
        pipe.write('test framework = ' + testFramework.name + '\n');
        pipe.write('config = ' + JSON.stringify(config, null, '  ') + '\n');
      }
      if (argv.watch || argv.watchAll) {
        setWatchMode(argv, argv.watch ? 'watch' : 'watchAll', {
          pattern: argv._,
        });

        let currentPattern = '';
        let hasSnapshotFailure = false;
        let isEnteringPattern = false;
        let isRunning = false;
        let testWatcher;
        let timer;
        let displayHelp = true;

        jestHasteMap.on('change', ({hasteFS}) => {
          // hasteMapFS = hasteFS;
          startRun();
        });

        const writeCurrentPattern = () => {
          clearLine(pipe);
          pipe.write(chalk.dim(' pattern \u203A ') + currentPattern);
        };

        const startRun = (overrideConfig: Object = {}) => {
          if (isRunning) {
            return null;
          }

          testWatcher = new TestWatcher({isWatchMode: true});
          pipe.write(CLEAR);
          preRunMessage.print(pipe);
          isRunning = true;
          return runJest(
            hasteMapFS,
            Object.freeze(Object.assign({}, config, overrideConfig)),
            argv,
            pipe,
            testWatcher,
            results => {
              isRunning = false;
              hasSnapshotFailure = !!results.snapshot.failure;
              testWatcher.setState({interrupted: false});
              if (displayHelp) {
                console.log(usage(argv, hasSnapshotFailure));
                displayHelp = !process.env.JEST_HIDE_USAGE;
              }
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
          if (isEnteringPattern) {
            switch (key) {
              case KEYS.ENTER:
                isEnteringPattern = false;
                setWatchMode(argv, 'watch', {
                  pattern: [currentPattern],
                });
                startRun();
                break;
              case KEYS.ESCAPE:
                isEnteringPattern = false;
                pipe.write(ansiEscapes.eraseLines(2));
                currentPattern = argv._[0];
                break;
              case KEYS.ARROW_DOWN:
              case KEYS.ARROW_LEFT:
              case KEYS.ARROW_RIGHT:
              case KEYS.ARROW_UP:
                break;
              default:
                const char = new Buffer(key, 'hex').toString();
                currentPattern = key === KEYS.BACKSPACE
                  ? currentPattern.slice(0, -1)
                  : currentPattern + char;
                writeCurrentPattern();
                break;
            }
            return;
          }

          // Abort test run
          if (
            isRunning &&
            testWatcher &&
            [KEYS.Q, KEYS.ENTER, KEYS.A, KEYS.O, KEYS.P].indexOf(key) !== -1
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
              setWatchMode(argv, 'watchAll');
              startRun();
              break;
            case KEYS.O:
              setWatchMode(argv, 'watch');
              startRun();
              break;
            case KEYS.P:
              isEnteringPattern = true;
              currentPattern = '';
              pipe.write('\n');
              writeCurrentPattern();
              break;
            case KEYS.QUESTION_MARK:
              if (process.env.JEST_HIDE_USAGE) {
                console.log(usage(argv, hasSnapshotFailure));
              }
              break;
          }
        };

        const onFileChange = (_, filePath: string) => {
          filePath = path.join(root, filePath);
          const coverageDirectory =
            config.coverageDirectory ||
            path.resolve(config.rootDir, 'coverage');
          const isValidPath =
            config.testPathDirs.some(dir => filePath.startsWith(dir)) &&
            !filePath.includes(coverageDirectory);

          if (!isValidPath) {
            return;
          }
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
          if (testWatcher && testWatcher.isInterrupted()) {
            return;
          }
          timer = setTimeout(startRun, WATCHER_DEBOUNCE);
        };

        if (typeof process.stdin.setRawMode === 'function') {
          process.stdin.setRawMode(true);
          process.stdin.resume();
          process.stdin.setEncoding('hex');
          process.stdin.on('data', onKeypress);
        }
        const callback = watcher => {
          watcher.on('error', error => {
            watcher.close();
            getWatcher(config, root, callback, {useWatchman: false});
          });
          watcher.on('all', onFileChange);
        };
        // getWatcher(config, root, callback, {useWatchman: true});
        startRun();
        return Promise.resolve();
      } else {
        preRunMessage.print(pipe);
        const testWatcher = new TestWatcher({isWatchMode: false});
        return runJest(hasteMap, config, argv, pipe, testWatcher,
          onComplete);
      }
    })
    .catch(error => {
      clearLine(process.stderr);
      clearLine(process.stdout);
      console.error(chalk.red(error.stack));
      process.exit(1);
    });
};

module.exports = {
  SearchSource,
  TestRunner,
  TestWatcher,
  getVersion: () => VERSION,
  run,
  runCLI,
};
