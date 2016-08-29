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

import type {Path} from 'types/Config';

require('jest-haste-map').fastpath.replace();

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const Runtime = require('jest-runtime');
const SearchSource = require('./SearchSource');
const TestRunner = require('./TestRunner');

const chalk = require('chalk');
const formatTestResults = require('./lib/formatTestResults');
const os = require('os');
const path = require('path');
const readConfig = require('jest-config').readConfig;
const {run} = require('./cli');
const sane = require('sane');
const which = require('which');

const CLEAR = '\x1B[2J\x1B[H';
const VERSION = require('../package.json').version;
const WATCHER_DEBOUNCE = 200;
const WATCHMAN_BIN = 'watchman';
const KEYS = {
  CONTROL_C: '03',
  CONTROL_D: '04',
  ENTER: '0d',
  U: '75',
};

function getMaxWorkers(argv) {
  if (argv.runInBand) {
    return 1;
  } else if (argv.maxWorkers) {
    return argv.maxWorkers;
  } else {
    const cpus = os.cpus().length;
    return Math.max(argv.watch ? Math.floor(cpus / 2) : cpus - 1, 1);
  }
}

function buildTestPathPatternInfo(argv) {
  if (argv.onlyChanged) {
    return {
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
}

function getWatcher(config, packageRoot, callback) {
  which(WATCHMAN_BIN, (err, resolvedPath) => {
    const watchman = !err && resolvedPath;
    const glob = config.moduleFileExtensions.map(ext => '**/*' + ext);
    const watcher = sane(packageRoot, {glob, watchman});
    callback(watcher);
  });
}

function runJest(config, argv, pipe, onComplete) {
  const patternInfo = buildTestPathPatternInfo(argv);
  const maxWorkers = getMaxWorkers(argv);
  return Runtime.createHasteContext(config, {maxWorkers})
    .then(hasteMap => {
      const source = new SearchSource(hasteMap, config);
      return source.getTestPaths(patternInfo)
        .then(data => {
          if (!data.paths.length) {
            pipe.write(
              source.getNoTestsFoundMessage(patternInfo, config, data) + '\n',
            );
          }
          if (data.paths.length === 1) {
            config = Object.assign({}, config, {verbose: true});
          }
          return new TestRunner(hasteMap, config, {maxWorkers}).runTests(
            data.paths,
          );
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
          return onComplete && onComplete(runResults.success);
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
}

function runCLI(argv: Object, root: Path, onComplete: () => void) {
  const pipe = argv.json ? process.stderr : process.stdout;

  argv = argv || {};
  if (argv.version) {
    pipe.write(`v${VERSION}\n`);
    onComplete && onComplete(true);
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
        argv.onlyChanged = !argv.watchAll;

        let isRunning: ?boolean;
        let timer: ?number;

        const startRun = (overrideConfig: Object = {}) => {
          if (isRunning) {
            return null;
          }

          pipe.write(CLEAR);
          isRunning = true;
          return runJest(
            Object.freeze(Object.assign({}, config, overrideConfig)),
            argv,
            pipe,
            () => {
              isRunning = false;
            },
          ).then(
            () => {},
            error => console.error(chalk.red(error)),
          );
        };

        const onKeypress = (key: string) => {
          switch (key) {
            case KEYS.CONTROL_C:
              process.exit(0);
              break;
            case KEYS.CONTROL_D:
              process.exit(0);
              break;
            case KEYS.ENTER:
              startRun();
              break;
            case KEYS.U:
              startRun({updateSnapshot: true});
              break;
          }
        };

        const onFileChange = (_, filePath: string) => {
          filePath = path.join(root, filePath);
          const isValidPath =
            config.testPathDirs.some(dir => filePath.startsWith(dir));

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
        return runJest(config, argv, pipe, onComplete);
      }
    })
    .catch(error => {
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = {
  getVersion: () => VERSION,
  run,
  runCLI,
  SearchSource,
  TestRunner,
};
