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
const childProcess = require('child_process');
const formatTestResults = require('./lib/formatTestResults');
const path = require('path');
const sane = require('sane');
const os = require('os');
const utils = require('./lib/utils');
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
  } else {
    const cpus = Math.max(os.cpus().length, 1);
    options.maxWorkers = argv.watch ? Math.floor(cpus / 2) : cpus - 1;
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
    return Promise.resolve(utils.normalizeConfig(argv.config, argv));
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
    const config = utils.normalizeConfig(pkgJson.jest, argv);
    config.name = pkgJson.name;
    return Promise.resolve(config);
  }

  // Sane default config
  return Promise.resolve(utils.normalizeConfig({
    name: packageRoot.replace(/[/\\]/g, '_'),
    rootDir: packageRoot,
    testPathIgnorePatterns: ['/node_modules/.+'],
  }, argv));
}

function getTestPaths(testRunner, config, patternInfo) {
  if (patternInfo.onlyChanged) {
    return findOnlyChangedTestPaths(testRunner, config);
  } else {
    return testRunner.promiseTestPathsMatching(new RegExp(patternInfo.pattern));
  }
}

function findOnlyChangedTestPaths(testRunner, config) {
  return Promise.all(config.testPathDirs.map(isGitRepository))
    .then(repos => {
      if (!repos.every(result => !!result)) {
        throw new Error(
          'It appears that one of your testPathDirs does not exist ' +
          'within a git repository. Currently --onlyChanged only works ' +
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

function getWatcher(argv, packageRoot, callback) {
  which(WATCHMAN_BIN, (err, resolvedPath) => {
    const watchman = !err && resolvedPath;
    const extensions = argv.watchExtensions || DEFAULT_WATCH_EXTENSIONS;
    const glob = extensions.split(',').map(extension => '**/*' + extension);
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
    pipe.write(`v${getVersion()}\n`);
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
      const info = ['v' + getVersion(), testFramework.name];
      if (config.usesBabelJest) {
        info.push('babel-jest');
      }

      const prefix = argv.watch ? 'Watch using' : 'Using';
      pipe.write(`${prefix} Jest CLI ${info.join(', ')}\n`);
      if (argv.watch) {
        getWatcher(argv, root, watcher => {
          let timer, isRunning;
          watcher.on('all', (_, filePath) => {
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
        runJest(config, argv, pipe, onComplete);
      }
    });
}

exports.TestRunner = TestRunner;
exports.getVersion = getVersion;
exports.runCLI = runCLI;
