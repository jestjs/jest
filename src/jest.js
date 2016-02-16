/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('fast-path').replace();

const realFs = require('fs');
const fs = require('graceful-fs');
fs.gracefulify(realFs);

const childProcess = require('child_process');
const path = require('path');
const TestRunner = require('./TestRunner');
const formatTestResults = require('./lib/formatTestResults');
const utils = require('./lib/utils');
const chalk = require('chalk');
const sane = require('sane');
const which = require('which');

const DEFAULT_WATCH_EXTENSIONS = 'js';
const WATCHER_DEBOUNCE = 200;
const WATCHMAN_BIN = 'watchman';

let jestVersion = null;
function getVersion() {
  if (jestVersion === null) {
    const packageJSON = path.resolve(__dirname, '..', 'package.json');
    jestVersion = require(packageJSON).version;
  }
  return jestVersion;
}

function findChangedFiles(cwd) {
  return new Promise((resolve, reject) => {
    const args = ['diff', '--name-only', '--diff-filter=ACMR', '--relative'];
    const child = childProcess.spawn('git', args, {cwd});

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => stdout += data);
    child.stderr.on('data', data => stderr += data);
    child.on('close', code => {
      if (code === 0) {
        stdout = stdout.trim();
        if (stdout === '') {
          resolve([]);
        } else {
          resolve(stdout.split('\n').map(
            changedPath => path.resolve(cwd, changedPath)
          ));
        }
      } else {
        reject(code + ': ' + stderr);
      }
    });
  });
}

function isGitRepository(cwd) {
  return new Promise(resolve => {
    let stdout = '';
    const child = childProcess.spawn('git', ['rev-parse', '--git-dir'], {cwd});
    child.stdout.on('data', data => stdout += data);
    child.on('close',
      code =>  resolve(code === 0 ? path.dirname(stdout.trim()) : null)
    );
  });
}

function testRunnerOptions(argv) {
  const options = {};
  if (argv.runInBand) {
    options.runInBand = argv.runInBand;
  }
  if (argv.maxWorkers) {
    options.maxWorkers = argv.maxWorkers;
  }
  return options;
}

function readConfig(argv, packageRoot) {
  return readRawConfig(argv, packageRoot).then(config => {
    if (argv.coverage) {
      config.collectCoverage = true;
    }

    if (argv.testEnvData) {
      config.testEnvData = argv.testEnvData;
    }

    config.noHighlight = argv.noHighlight || !process.stdout.isTTY;

    if (argv.verbose) {
      config.verbose = argv.verbose;
    }

    if (argv.bail) {
      config.bail = argv.bail;
    }

    if (argv.cache !== null) {
      config.cache = argv.cache;
    }

    if (argv.watchman !== null) {
      config.watchman = argv.watchman;
    }

    if (argv.useStderr) {
      config.useStderr = argv.useStderr;
    }

    if (argv.json) {
      config.useStderr = true;
    }

    if (argv.testRunner) {
      try {
        config.testRunner = require.resolve(
          argv.testRunner.replace(/<rootDir>/g, config.rootDir)
        );
      } catch (e) {
        throw new Error(
          `jest: testRunner path "${argv.testRunner}" is not a valid path.`
        );
      }
    }

    if (argv.logHeapUsage) {
      config.logHeapUsage = argv.logHeapUsage;
    }

    config.noStackTrace = argv.noStackTrace;

    return config;
  });
}

function readRawConfig(argv, packageRoot) {
  if (typeof argv.config === 'string') {
    return utils.loadConfigFromFile(argv.config);
  }

  if (typeof argv.config === 'object') {
    return Promise.resolve(utils.normalizeConfig(argv.config));
  }

  const pkgJsonPath = path.join(packageRoot, 'package.json');
  const pkgJson = fs.existsSync(pkgJsonPath) ? require(pkgJsonPath) : {};

  // Look to see if there is a package.json file with a jest config in it
  if (pkgJson.jest) {
    if (!pkgJson.jest.hasOwnProperty('rootDir')) {
      pkgJson.jest.rootDir = packageRoot;
    } else {
      pkgJson.jest.rootDir = path.resolve(packageRoot, pkgJson.jest.rootDir);
    }
    const config = utils.normalizeConfig(pkgJson.jest);
    config.name = pkgJson.name;
    return Promise.resolve(config);
  }

  // Sane default config
  return Promise.resolve(utils.normalizeConfig({
    name: packageRoot.replace(/[/\\]/g, '_'),
    rootDir: packageRoot,
    testPathDirs: [packageRoot],
    testPathIgnorePatterns: ['/node_modules/.+'],
  }));
}

function findOnlyChangedTestPaths(testRunner, config) {
  return Promise.all(config.testPathDirs.map(isGitRepository))
    .then(repos => {
      if (!repos.every(result => !!result)) {
        throw new Error(
          'It appears that one of your testPathDirs does not exist ' +
          'with in a git repository. Currently --onlyChanged only works ' +
          'with git projects.\n'
        );
      }
      return Promise.all(Array.from(repos).map(findChangedFiles));
    })
    .then(changedPathSets => testRunner.promiseTestPathsRelatedTo(
      new Set(Array.prototype.concat.apply([], changedPathSets))
    ));
}

function buildTestPathPatternInfo(argv) {
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

function findMatchingTestPaths(pattern, testRunner) {
  return testRunner.promiseTestPathsMatching(new RegExp(pattern));
}


function getNoTestsFoundMessage(patternInfo) {
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

/**
 * use watchman when possible
 */
function getWatcher(argv, packageRoot, callback) {
  which(WATCHMAN_BIN, function(err, resolvedPath) {
    const watchman = !err && resolvedPath;
    const watchExtensions = argv.watchExtensions || DEFAULT_WATCH_EXTENSIONS;
    const glob = watchExtensions.split(',').map(function(extension) {
      return '**/*' + extension;
    });
    const watcher = sane(packageRoot, {glob, watchman});
    callback(watcher);
  });
}

function runCLI(argv, packageRoot, onComplete) {
  argv = argv || {};

  if (argv.version) {
    console.log('v' + getVersion());
    onComplete && onComplete(true);
    return;
  }

  const pipe = argv.json ? process.stderr : process.stdout;

  function _runCLI(filePath) {
    readConfig(argv, packageRoot)
      .then(config => {
        // Disable colorization
        if (config.noHighlight) {
          chalk.enabled = false;
        }

        const testFramework = require(config.testRunner);
        pipe.write(`Using Jest CLI v${getVersion()}, ${testFramework.name}\n`);

        const testRunner = new TestRunner(config, testRunnerOptions(argv));
        let testPaths;
        if (argv.onlyChanged) {
          testPaths = findOnlyChangedTestPaths(testRunner, config);
        } else {
          const patternInfo = buildTestPathPatternInfo(argv);
          testPaths = findMatchingTestPaths(patternInfo.pattern, testRunner)
            .then(testPaths => {
              if (!testPaths.length) {
                pipe.write(`${getNoTestsFoundMessage(patternInfo)}\n`);
              }
              return testPaths;
            });
        }

        return testPaths.then(testPaths => {
          const shouldTest = !filePath || testPaths.some(testPath => {
            return testPath.indexOf(filePath) !== -1;
          });
          const tests = shouldTest ? testPaths : [];
          return testRunner.runTests(tests);
        });
      })
      .then(runResults => {
        if (argv.json) {
          process.stdout.write(JSON.stringify(formatTestResults(runResults)));
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

  if (argv.watch !== undefined) {
    getWatcher(argv, packageRoot, watcher => {
      let tid;
      watcher.on('all', (_, filePath) => {
        if (tid) {
          clearTimeout(tid);
          tid = null;
        }
        tid = setTimeout(() => {
          _runCLI(filePath);
        }, WATCHER_DEBOUNCE);
      });
      if (argv.watch !== 'skip') {
        _runCLI();
      }
    });
  } else {
    _runCLI();
  }
}

exports.TestRunner = TestRunner;
exports.getVersion = getVersion;
exports.runCLI = runCLI;
