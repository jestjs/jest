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

require('jest-haste-map').fastpath.replace();

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const Runtime = require('jest-runtime');
const SearchSource = require('./SearchSource');
const TestRunner = require('./TestRunner');

const {clearLine} = require('jest-util');
const {run} = require('./cli');
const chalk = require('chalk');
const formatTestResults = require('./lib/formatTestResults');
const os = require('os');
const path = require('path');
const readConfig = require('jest-config').readConfig;
const sane = require('sane');
const which = require('which');

const CLEAR = '\x1B[2J\x1B[H';
const VERSION = require('../package.json').version;
const WATCHER_DEBOUNCE = 200;
const WATCHMAN_BIN = 'watchman';
const KEYS = {
  A: '61',
  BACKSPACE: '7f',
  CONTROL_C: '03',
  CONTROL_D: '04',
  ENTER: '0d',
  O: '6f',
  P: '70',
  U: '75',
};

const printHeader = pipe => {
  if (process.stdout.isTTY) {
    pipe.write(chalk.bold.dim('Determining test suites to run...'));
  }
};

const getMaxWorkers = argv => {
  if (argv.runInBand) {
    return 1;
  } else if (argv.maxWorkers) {
    return argv.maxWorkers;
  } else {
    const cpus = os.cpus().length;
    return Math.max(argv.watch ? Math.floor(cpus / 2) : cpus - 1, 1);
  }
};

const buildTestPathPatternInfo = argv => {
  if (argv.onlyChanged) {
    return {
      input: '',
      lastCommit: argv.lastCommit,
      onlyChanged: true,
      watch: argv.watch,
    };
  }
  if (argv.testPathPattern) {
    return {
      input: argv.testPathPattern,
      testPathPattern: argv.testPathPattern,
      shouldTreatInputAsPattern: true,
    };
  }
  if (argv._ && argv._.length) {
    return {
      input: argv._.join(' '),
      testPathPattern: argv._.join('|'),
      shouldTreatInputAsPattern: false,
    };
  }
  return {
    input: '',
    testPathPattern: '',
    shouldTreatInputAsPattern: false,
  };
};

const getWatcher = (config, packageRoot, callback) => {
  which(WATCHMAN_BIN, (err, resolvedPath) => {
    const watchman = !err && resolvedPath;
    const glob = config.moduleFileExtensions.map(ext => '**/*' + ext);
    const watcher = sane(packageRoot, {glob, watchman});
    callback(watcher);
  });
};

const runJest = (config, argv, pipe, onComplete) => {
  const patternInfo = buildTestPathPatternInfo(argv);
  const maxWorkers = getMaxWorkers(argv);
  return Runtime.createHasteContext(config, {maxWorkers})
    .then(hasteMap => {
      const source = new SearchSource(hasteMap, config);
      return source.getTestPaths(patternInfo)
        .then(data => {
          if (!data.paths.length) {
            clearLine(pipe);
            pipe.write(
              source.getNoTestsFoundMessage(patternInfo, config, data) + '\n',
            );
          }
          if (data.paths.length === 1) {
            config = Object.assign({}, config, {verbose: true});
          }
          return new TestRunner(
            hasteMap,
            config,
            {
              maxWorkers,
              getTestSummary: () => SearchSource.getTestSummary(patternInfo),
            },
          ).runTests(data.paths);
        })
        .then(runResults => {
          if (config.testResultsProcessor) {
            /* $FlowFixMe */
            const processor = require(config.testResultsProcessor);
            processor(runResults);
          }
          if (argv.json) {
            process.stdout.write(
              JSON.stringify(formatTestResults(runResults, config)),
            );
          }
          return onComplete && onComplete(runResults);
        }).catch(error => {
          if (error.type == 'DependencyGraphError') {
            throw new Error([
              '\nError: ' + error.message + '\n\n',
              'This is most likely a setup ',
              'or configuration issue. To resolve a module name collision, ',
              'change or blacklist one of the offending modules. See ',
              'http://facebook.github.io/jest/docs/api.html#modulepathignorepatterns-array-string',
            ].join(''));
          } else {
            throw error;
          }
        });
    });
};

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
    .then(config => {
      if (argv.debug) {
        /* $FlowFixMe */
        const testFramework = require(config.testRunner);
        pipe.write('jest version = ' + VERSION + '\n');
        pipe.write('test framework = ' + testFramework.name + '\n');
        pipe.write('config = ' + JSON.stringify(config, null, '  ') + '\n');
      }
      if (argv.watch || argv.watchAll) {
        const setMode = (mode: 'watch' | 'watchAll') => {
          if (mode === 'watch') {
            argv.watch = true;
            argv.watchAll = false;
          } else if (mode === 'watchAll') {
            argv.watch = false;
            argv.watchAll = true;
          }
          // Reset before setting it to the new value
          argv.onlyChanged = false;
          argv.onlyChanged =
            buildTestPathPatternInfo(argv).input === '' && !argv.watchAll;
        };

        setMode(argv.watch ? 'watch' : 'watchAll');

        let isRunning = false;
        let isEnteringPattern = false;
        let currentPattern = '';
        let timer: ?number;

        const writeCurrentPattern = () => {
          clearLine(pipe);
          pipe.write(chalk.dim(' pattern \u203A ' + currentPattern));
        };

        const startRun = (overrideConfig: Object = {}) => {
          if (isRunning) {
            return null;
          }

          pipe.write(CLEAR);
          printHeader(pipe);
          isRunning = true;
          return runJest(
            Object.freeze(Object.assign({}, config, overrideConfig)),
            argv,
            pipe,
            results => {
              isRunning = false;
              /* eslint-disable max-len */
              const messages = [
                '\n' + chalk.bold('Watch Usage'),
                argv.watch
                  ? chalk.dim(' \u203A Press `a` to run all tests.')
                  : null,
                argv.watchAll
                  ? chalk.dim(' \u203A Press `o` to only run tests related to changed files.')
                  : null,
                results.snapshot.failure
                  ? chalk.dim(' \u203A Press `u` to update failing snapshots.')
                  : null,
                chalk.dim(' \u203A Press `p` to enter a new test pattern.'),
                chalk.dim(' \u203A Press `enter` to trigger a test run.'),
              ];
              /* eslint-enable max-len */
              console.log(messages.filter(message => !!message).join('\n'));
            },
          ).then(
            () => {},
            error => console.error(chalk.red(error)),
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
                argv._ = [currentPattern];
                setMode('watch');
                startRun();
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
          switch (key) {
            case KEYS.ENTER:
              startRun();
              break;
            case KEYS.U:
              startRun({updateSnapshot: true});
              break;
            case KEYS.A:
              setMode('watchAll');
              startRun();
              break;
            case KEYS.O:
              setMode('watch');
              startRun();
              break;
            case KEYS.P:
              isEnteringPattern = true;
              currentPattern = '';
              pipe.write('\n');
              writeCurrentPattern();
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
          timer = setTimeout(startRun, WATCHER_DEBOUNCE);
        };

        if (typeof process.stdin.setRawMode === 'function') {
          process.stdin.setRawMode(true);
          process.stdin.resume();
          process.stdin.setEncoding('hex');
          process.stdin.on('data', onKeypress);
        }
        getWatcher(config, root, watcher => watcher.on('all', onFileChange));
        startRun();
        return Promise.resolve();
      } else {
        printHeader(pipe);
        return runJest(config, argv, pipe, onComplete);
      }
    })
    .catch(error => {
      console.error(error.stack);
      process.exit(1);
    });
};

module.exports = {
  getVersion: () => VERSION,
  run,
  runCLI,
  SearchSource,
  TestRunner,
};
