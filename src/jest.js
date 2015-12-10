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
const chalk = require('chalk');

let jestVersion = null;
function getVersion() {
  if (jestVersion === null) {
    const packageJSON = path.resolve(__dirname, '..', 'package.json');
    jestVersion = require(packageJSON).version;
  }
  return jestVersion;
}

function findChangedFiles(dirPath) {
  return new Promise((resolve, reject) => {
    const args = ['diff', '--name-only', '--diff-filter=ACMR'];
    const child = childProcess.spawn('git', args, {cwd: dirPath});

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
            changedPath => path.resolve(dirPath, changedPath)
          ));
        }
      } else {
        reject(code + ': ' + stderr);
      }
    });
  });
}

function verifyIsGitRepository(dirPath) {
  return new Promise(resolve =>
    childProcess.spawn('git', ['rev-parse', '--git-dir'], {cwd: dirPath})
      .on('close', code => {
        const isGitRepo = code === 0;
        resolve(isGitRepo);
      })
  );
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
  const testPathDirsAreGit = config.testPathDirs.map(verifyIsGitRepository);
  return Promise.all(testPathDirsAreGit)
    .then(results => {
      if (!results.every(result => !!result)) {
        /* eslint-disable no-throw-literal */
        throw (
          'It appears that one of your testPathDirs does not exist ' +
          'with in a git repository. Currently --onlyChanged only works ' +
          'with git projects.\n'
        );
        /* eslint-enable no-throw-literal */
      }
      return Promise.all(config.testPathDirs.map(findChangedFiles));
    })
    .then(changedPathSets => {
      // Collapse changed files from each of the testPathDirs into a single list
      // of changed file paths
      let changedPaths = [];
      changedPathSets.forEach(
        pathSet => changedPaths = changedPaths.concat(pathSet)
      );
      return testRunner.promiseTestPathsRelatedTo(changedPaths);
    });
}

function findMatchingTestPaths(argv, testRunner) {
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
  readConfig(argv, packageRoot)
    .then(config => {
      // Disable colorization
      if (config.noHighlight) {
        chalk.enabled = false;
      }

      const testRunner = new TestRunner(config, testRunnerOptions(argv));
      const testFramework = require(config.testRunner);
      pipe.write(`Using Jest CLI v${getVersion()}, ${testFramework.name}\n`);

      const testPaths = argv.onlyChanged ?
        findOnlyChangedTestPaths(testRunner, config) :
        findMatchingTestPaths(argv, testRunner);
      return testPaths.then(testPaths => testRunner.runTests(testPaths));
    })
    .then(runResults => {
      if (argv.json) {
        process.stdout.write(JSON.stringify(formatTestResults(runResults)));
      }
      return runResults;
    })
    .then(runResults => onComplete && onComplete(runResults.success))
    .catch(error => {
      console.error('Failed with unexpected error.');
      process.nextTick(() => {
        throw error;
      });
    });
}

exports.TestRunner = TestRunner;
exports.getVersion = getVersion;
exports.runCLI = runCLI;
