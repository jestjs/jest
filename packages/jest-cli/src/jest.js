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

const TestRunner = require('./TestRunner');
const SearchSource = require('./SearchSource');

const buildHasteMap = require('./lib/buildHasteMap');
const chalk = require('chalk');
const constants = require('./constants');
const formatTestResults = require('./lib/formatTestResults');
const os = require('os');
const path = require('path');
const readConfig = require('jest-config').readConfig;
const sane = require('sane');
const which = require('which');

const CLEAR = '\x1B[2J\x1B[H';
const WATCHER_DEBOUNCE = 200;
const WATCHMAN_BIN = 'watchman';

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
      onlyChanged: true,
      watch: argv.watch !== undefined,
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
  const hasteMap = buildHasteMap(config, {maxWorkers});
  const source = new SearchSource(hasteMap, config);
  return source.getTestPaths(patternInfo)
    .then(data => {
      if (!data.paths.length) {
        pipe.write(
          source.getNoTestsFoundMessage(patternInfo, config, data) + '\n'
        );
      }
      return data.paths;
    })
    .then(testPaths =>
      new TestRunner(hasteMap, config, {maxWorkers}).runTests(testPaths)
    )
    .then(runResults => {
      if (config.testResultsProcessor) {
        /* $FlowFixMe */
        const processor = require(config.testResultsProcessor);
        processor(runResults);
      }
      if (argv.json) {
        process.stdout.write(
          JSON.stringify(formatTestResults(runResults, config))
        );
      }
      return runResults;
    })
    .then(runResults => onComplete && onComplete(runResults.success))
    .catch(error => {
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
}

function runCLI(argv: Object, root: Path, onComplete: () => void) {
  const pipe = argv.json ? process.stderr : process.stdout;

  argv = argv || {};
  if (argv.version) {
    pipe.write(`v${constants.VERSION}\n`);
    onComplete && onComplete(true);
    return;
  }

  readConfig(argv, root)
    .then(config => {
      // Disable colorization
      if (config.noHighlight) {
        chalk.enabled = false;
      }

      /* $FlowFixMe */
      const testFramework = require(config.testRunner);
      const info = [`v${constants.VERSION}`, testFramework.name];
      if (config.usesBabelJest) {
        info.push('babel-jest');
      }

      const prefix = argv.watch ? 'Watch using' : 'Using';
      const header = `${prefix} Jest CLI ${info.join(', ')}\n`;
      if (argv.watch !== undefined) {
        if (argv.watch !== 'all') {
          argv.onlyChanged = true;
        }

        getWatcher(config, root, watcher => {
          let timer;
          let isRunning;

          pipe.write(CLEAR + header);
          watcher.on('all', (_, filePath) => {
            pipe.write(CLEAR + header);
            filePath = path.join(root, filePath);
            const isValidPath =
              config.testPathDirs.some(dir => filePath.startsWith(dir));
            if (!isRunning && isValidPath) {
              if (timer) {
                clearTimeout(timer);
                timer = null;
              }
              timer = setTimeout(
                () => {
                  isRunning = true;
                  runJest(config, argv, pipe, () => isRunning = false);
                },
                WATCHER_DEBOUNCE
              );
            }
          });
        });
      } else {
        pipe.write(header);
        runJest(config, argv, pipe, onComplete);
      }
    })
    .catch(error => {
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = {
  buildHasteMap,
  getVersion: () => constants.VERSION,
  runCLI,
  SearchSource,
  TestRunner,
};
