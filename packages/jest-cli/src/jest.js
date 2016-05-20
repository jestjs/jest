/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('jest-haste-map').fastpath.replace();

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const TestRunner = require('./TestRunner');

const chalk = require('chalk');
const constants = require('./constants');
const formatTestResults = require('./lib/formatTestResults');
const os = require('os');
const path = require('path');
const readConfig = require('./config/read');
const sane = require('sane');
const which = require('which');
const changedFiles = require('jest-changed-files');

const git = changedFiles.git;
const hg = changedFiles.hg;

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

function getTestPaths(testRunner, config, patternInfo) {
  if (patternInfo.onlyChanged) {
    return findOnlyChangedTestPaths(testRunner, config);
  } else {
    return testRunner.promiseTestPathsMatching(patternInfo.pattern);
  }
}

function findOnlyChangedTestPaths(testRunner, config) {
  return Promise.all(config.testPathDirs.map(determineSCM))
    .then(repos => {
      if (!repos.every(result => result[0] || result[1])) {
        throw new Error(
          'It appears that one of your testPathDirs does not exist ' +
          'within a git or hg repository. Currently `--onlyChanged` ' +
          'only works with git or hg projects.'
        );
      }
      return Promise.all(Array.from(repos).map(repo => {
        return repo[0]
          ? git.findChangedFiles(repo[0])
          : hg.findChangedFiles(repo[1]);
      }));
    })
    .then(changedPathSets => testRunner.promiseTestPathsRelatedTo(
      new Set(Array.prototype.concat.apply([], changedPathSets))
    ));
}

function determineSCM(path) {
  return Promise.all([
    git.isGitRepository(path),
    hg.isHGRepository(path),
  ]);
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
    pattern: '',
    shouldTreatInputAsPattern: false,
  };
}

function getNoTestsFoundMessage(patternInfo) {
  if (patternInfo.onlyChanged) {
    const guide = patternInfo.watch
      ? 'starting Jest with `jest --watch=all`'
      : 'running Jest without `-o`';
    return 'No tests found related to changed and uncommitted files.\n' +
    'Note: If you are using dynamic `require`-calls or no tests related ' +
    'to your changed files can be found, consider ' + guide + '.';
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
    const glob = config.moduleFileExtensions.map(ext => '**/*' + ext);
    const watcher = sane(packageRoot, {glob, watchman});
    callback(watcher);
  });
}

function runJest(config, argv, pipe, onComplete) {
  if (argv.silent) {
    config.silent = true;
  }
  const testRunner = new TestRunner(config, {
    maxWorkers: getMaxWorkers(argv),
  });
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
      if (config.testResultsProcessor) {
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
