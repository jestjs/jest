/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('node-haste/lib/fastpath').replace();

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const TestRunner = require('./TestRunner');

const chalk = require('chalk');
const constants = require('./constants');
const formatTestResults = require('./lib/formatTestResults');
const git = require('./lib/git');
const os = require('os');
const path = require('path');
const readConfig = require('./config/read');
const sane = require('sane');
const which = require('which');

const CLEAR = '\x1B[2J\x1B[H';
const WATCHER_DEBOUNCE = 200;
const WATCHMAN_BIN = 'watchman';

function testRunnerOptions(argv) {
  const options = {};
  if (argv.runInBand) {
    options.runInBand = argv.runInBand;
  }
  if (argv.maxWorkers) {
    options.maxWorkers = argv.maxWorkers;
  } else {
    const cpus = Math.max(os.cpus().length, 1);
    options.maxWorkers = argv.watch ? Math.floor(cpus / 2) : cpus - 1;
  }
  return options;
}

function getTestPaths(testRunner, config, patternInfo) {
  if (patternInfo.onlyChanged) {
    return findOnlyChangedTestPaths(testRunner, config);
  } else {
    return testRunner.promiseTestPathsMatching(patternInfo.pattern);
  }
}

function findOnlyChangedTestPaths(testRunner, config) {
  return Promise.all(config.testPathDirs.map(git.isGitRepository))
    .then(repos => {
      if (!repos.every(result => !!result)) {
        throw new Error(
          'It appears that one of your testPathDirs does not exist ' +
          'within a git repository. Currently --onlyChanged only works ' +
          'with git projects.\n'
        );
      }
      return Promise.all(Array.from(repos).map(git.findChangedFiles));
    })
    .then(changedPathSets => testRunner.promiseTestPathsRelatedTo(
      new Set(Array.prototype.concat.apply([], changedPathSets))
    ));
}

function buildTestPathPatternInfo(argv) {
  if (argv.onlyChanged) {
    return {
      onlyChanged: true,
    };
  }
  if (argv.testPathPattern) {
    return {
      input: argv.testPathPattern,
      pattern: argv.testPathPattern,
      shouldTreatInputAsPattern: true,
    };
  }
  if (argv._ && argv._.length) {
    return {
      input: argv._.join(' '),
      pattern: argv._.join('|'),
      shouldTreatInputAsPattern: false,
    };
  }
  return {
    input: '',
    pattern: '.*',
    shouldTreatInputAsPattern: false,
  };
}

function getNoTestsFoundMessage(patternInfo) {
  if (patternInfo.onlyChanged) {
    return 'No tests found related to changed and uncommitted files.';
  }
  const pattern = patternInfo.pattern;
  const input = patternInfo.input;
  const shouldTreatInputAsPattern = patternInfo.shouldTreatInputAsPattern;

  const formattedPattern = `/${pattern}/`;
  const formattedInput = shouldTreatInputAsPattern ?
    `/${input}/` :
    `"${input}"`;

  const message = `No tests found for ${formattedInput}.`;
  return input === pattern ?
    message :
    `${message} Regex used while searching: ${formattedPattern}.`;
}

function getWatcher(config, packageRoot, callback) {
  which(WATCHMAN_BIN, (err, resolvedPath) => {
    const watchman = !err && resolvedPath;
    const glob = config.moduleFileExtensions
      .concat(config.testFileExtensions)
      .map(extension => '**/*' + extension);
    const watcher = sane(packageRoot, {glob, watchman});
    callback(watcher);
  });
}

function runJest(config, argv, pipe, onComplete) {
  const testRunner = new TestRunner(config, testRunnerOptions(argv));
  const patternInfo = buildTestPathPatternInfo(argv);
  return getTestPaths(testRunner, config, patternInfo)
    .then(testPaths => {
      if (!testPaths.length) {
        pipe.write(`${getNoTestsFoundMessage(patternInfo)}\n`);
      }
      return testPaths;
    })
    .then(testPaths => testRunner.runTests(testPaths))
    .then(runResults => {
      if (argv.json) {
        process.stdout.write(
          JSON.stringify(formatTestResults(runResults))
        );
      }
      return runResults;
    })
    .then(runResults => onComplete && onComplete(runResults.success))
    .catch(error => {
      if (error.type == 'DependencyGraphError') {
        console.error([
          '\nError: ' + error.message + '\n\n',
          'This is most likely a setup ',
          'or configuration issue. To resolve a module name collision, ',
          'change or blacklist one of the offending modules. See ',
          'http://facebook.github.io/jest/docs/api.html#config-modulepathignorepatterns-array-string',
        ].join(''));
      } else {
        console.error(
          '\nUnexpected Error: ' + error.message + '\n\n' + error.stack
        );
      }
      process.exit(1);
    });
}

function runCLI(argv, root, onComplete) {
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
        return runJest(config, argv, pipe, onComplete);
      }
    })
    .catch(error => {
      console.error(error.stack);
      process.exit(1);
    });
}

exports.TestRunner = TestRunner;
exports.getVersion = () => constants.VERSION;
exports.runCLI = runCLI;
