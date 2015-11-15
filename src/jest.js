/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const TestRunner = require('./TestRunner');
const formatTestResults = require('./lib/formatTestResults');
const utils = require('./lib/utils');

let _jestVersion = null;
function getVersion() {
  if (_jestVersion === null) {
    const pkgJsonPath = path.resolve(__dirname, '..', 'package.json');
    _jestVersion = require(pkgJsonPath).version;
  }
  return _jestVersion;
}

function _findChangedFiles(dirPath) {
  return new Promise(function(resolve, reject) {
    const args =
      ['diff', '--name-only', '--diff-filter=ACMR'];
    const child = childProcess.spawn('git', args, {cwd: dirPath});

    let stdout = '';
    child.stdout.on('data', function(data) {
      stdout += data;
    });

    let stderr = '';
    child.stderr.on('data', function(data) {
      stderr += data;
    });

    child.on('close', function(code) {
      if (code === 0) {
        stdout = stdout.trim();
        if (stdout === '') {
          resolve([]);
        } else {
          resolve(stdout.split('\n').map(function(changedPath) {
            return path.resolve(dirPath, changedPath);
          }));
        }
      } else {
        reject(code + ': ' + stderr);
      }
    });
  });
}

function _verifyIsGitRepository(dirPath) {
  return new Promise(function(resolve) {
    childProcess.spawn('git', ['rev-parse', '--git-dir'], {cwd: dirPath})
      .on('close', function(code) {
        const isGitRepo = code === 0;
        resolve(isGitRepo);
      });
  });
}

function _testRunnerOptions(argv) {
  const options = {};
  if (argv.runInBand) {
    options.runInBand = argv.runInBand;
  }
  if (argv.maxWorkers) {
    options.maxWorkers = argv.maxWorkers;
  }
  return options;
}

function _promiseConfig(argv, packageRoot) {
  return _promiseRawConfig(argv, packageRoot).then(function(config) {
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

function _promiseRawConfig(argv, packageRoot) {
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

function _promiseOnlyChangedTestPaths(testRunner, config) {
  const testPathDirsAreGit = config.testPathDirs.map(_verifyIsGitRepository);
  return Promise.all(testPathDirsAreGit)
    .then(function(results) {
      if (!results.every(function(result) { return result; })) {
        /* eslint-disable no-throw-literal */
        throw (
          'It appears that one of your testPathDirs does not exist ' +
          'with in a git repository. Currently --onlyChanged only works ' +
          'with git projects.\n'
        );
        /* eslint-enable no-throw-literal */
      }
      return Promise.all(config.testPathDirs.map(_findChangedFiles));
    })
    .then(function(changedPathSets) {
      // Collapse changed files from each of the testPathDirs into a single list
      // of changed file paths
      let changedPaths = [];
      changedPathSets.forEach(function(pathSet) {
        changedPaths = changedPaths.concat(pathSet);
      });
      return testRunner.promiseTestPathsRelatedTo(changedPaths);
    });
}

function _promisePatternMatchingTestPaths(argv, testRunner) {
  const pattern = argv.testPathPattern ||
    ((argv._ && argv._.length) ? argv._.join('|') : '.*');

  return testRunner.promiseTestPathsMatching(new RegExp(pattern));
}

function runCLI(argv, packageRoot, onComplete) {
  argv = argv || {};

  if (argv.version) {
    console.log('v' + getVersion());
    onComplete && onComplete(true);
    return;
  }

  const pipe = argv.json ? process.stderr : process.stdout;
  pipe.write('Using Jest CLI v' + getVersion() + '\n');

  _promiseConfig(argv, packageRoot).then(function(config) {
    const testRunner = new TestRunner(config, _testRunnerOptions(argv));
    const testPaths = argv.onlyChanged ?
      _promiseOnlyChangedTestPaths(testRunner, config) :
      _promisePatternMatchingTestPaths(argv, testRunner);
    return testPaths.then(function(testPaths) {
      return testRunner.runTests(testPaths);
    });
  }).then(function(runResults) {
    if (argv.json) {
      process.stdout.write(JSON.stringify(formatTestResults(runResults)));
    }
    return runResults;
  }).then(function(runResults) {
    onComplete && onComplete(runResults.success);
  }).catch(function(error) {
    console.error('Failed with unexpected error.');
    process.nextTick(function() {
      throw error;
    });
  });
}

exports.TestRunner = TestRunner;
exports.getVersion = getVersion;
exports.runCLI = runCLI;
