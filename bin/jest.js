#!/usr/bin/env node
/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
/* jshint node: true */
"use strict";

var child_process = require('child_process');
var defaultTestResultHandler = require('../src/defaultTestResultHandler');
var fs = require('fs');
var harmonize = require('harmonize');
var optimist = require('optimist');
var path = require('path');
var Q = require('q');
var TestRunner = require('../src/TestRunner');
var colors = require('../src/lib/colors');
var utils = require('../src/lib/utils');

var _jestVersion = null;
function _getJestVersion() {
  if (_jestVersion === null) {
    var pkgJsonPath = path.resolve(__dirname, '..', 'package.json');
    _jestVersion = require(pkgJsonPath).version;
  }
  return _jestVersion;
}

function _findChangedFiles(dirPath) {
  var deferred = Q.defer();

  var args =
    ['diff', '--name-only', '--diff-filter=ACMR'];
  var child = child_process.spawn('git', args, {cwd: dirPath});

  var stdout = '';
  child.stdout.on('data', function(data) {
    stdout += data;
  });

  var stderr = '';
  child.stderr.on('data', function(data) {
    stderr += data;
  });

  child.on('close', function(code) {
    if (code === 0) {
      stdout = stdout.trim();
      if (stdout === '') {
        deferred.resolve([]);
      } else {
        deferred.resolve(stdout.split('\n').map(function(changedPath) {
          return path.resolve(dirPath, changedPath);
        }));
      }
    } else {
      deferred.reject(code + ': ' + stderr);
    }
  });

  return deferred.promise;
}

function _onResultReady(config, result) {
  return defaultTestResultHandler(config, result);
}

function _onRunComplete(completionData) {
  var numFailedTests = completionData.numFailedTests;
  var numTotalTests = completionData.numTotalTests;
  var numPassedTests = numTotalTests - numFailedTests;
  var startTime = completionData.startTime;
  var endTime = completionData.endTime;

  var results = '';
  if (numFailedTests) {
    results += colors.colorize(numFailedTests + ' tests failed', colors.RED + colors.BOLD) + ', ';
  }
  results +=
    colors.colorize(numPassedTests + ' tests passed', colors.GREEN + colors.BOLD) +
    ' (' + numTotalTests + ' total)';

  console.log(results);
  console.log('Run time: ' + ((endTime - startTime) / 1000) + 's');
  process.exit(numFailedTests ? 1 : 0);
}

function _verifyIsGitRepository(dirPath) {
  var deferred = Q.defer();

  child_process.spawn('git', ['rev-parse', '--git-dir'], {cwd: dirPath})
    .on('close', function(code) {
      var isGitRepo = code === 0;
      deferred.resolve(isGitRepo);
    });

  return deferred.promise;
}

/**
 * Takes a description string, puts it on the next line, indents it, and makes
 * sure it wraps without exceeding 80chars
 */
function _wrapDesc(desc) {
  var indent = '\n      ';
  return indent + desc.split(' ').reduce(function(wrappedDesc, word) {
    var lastLineIdx = wrappedDesc.length - 1;
    var lastLine = wrappedDesc[lastLineIdx];

    var appendedLastLine = lastLine === '' ? word : (lastLine + ' ' + word);

    if (appendedLastLine.length > 80) {
      wrappedDesc.push(word);
    } else {
      wrappedDesc[lastLineIdx] = appendedLastLine;
    }

    return wrappedDesc;
  }, ['']).join(indent);
}

function runCLI(argv, packageRoot) {
  if (argv.version) {
    console.log('v' + _getJestVersion());
    process.exit(0);
  }

  var config;
  if (argv.config) {
    config = utils.loadConfigFromFile(argv.config);
  } else {
    var pkgJsonPath = path.join(packageRoot, 'package.json');
    var pkgJson = fs.existsSync(pkgJsonPath) ? require(pkgJsonPath) : {};

    // First look to see if there is a package.json file with a jest config in it
    if (pkgJson.jest) {
      if (!pkgJson.jest.hasOwnProperty('rootDir')) {
        pkgJson.jest.rootDir = packageRoot;
      } else {
        pkgJson.jest.rootDir = path.resolve(packageRoot, pkgJson.jest.rootDir);
      }
      config = utils.normalizeConfig(pkgJson.jest);
      config.name = pkgJson.name;
      config = Q(config);

    // If not, use a sane default config
    } else {
      config = Q(utils.normalizeConfig({
        name: packageRoot.replace(/[/\\]/g, '_'),
        rootDir: packageRoot,
        testPathDirs: [packageRoot],
        testPathIgnorePatterns: ['/node_modules/.+']
      }));
    }
  }

  config.done(function(config) {
    var pathPattern =
      argv._.length === 0
      ? /.*/
      : new RegExp(argv._.join('|'));

    var testRunnerOpts = {};
    if (argv.maxWorkers) {
      testRunnerOpts.maxWorkers = argv.maxWorkers;
    }

    if (argv.coverage) {
      config.collectCoverage = true;
    }

    var testRunner = new TestRunner(config, testRunnerOpts);

    function _runTestsOnPathPattern(pathPattern) {
      return testRunner.findTestPathsMatching(pathPattern)
        .then(function(matchingTestPaths) {
          console.log('Found ' + matchingTestPaths.length + ' matching tests...');
          if (argv.runInBand) {
            return testRunner.runTestsInBand(matchingTestPaths, _onResultReady);
          } else {
            return testRunner.runTestsParallel(matchingTestPaths, _onResultReady);
          }
        })
        .then(_onRunComplete);
    }

    if (argv.onlyChanged) {
      console.log('Looking for changed files...');

      var testPathDirsAreGit = config.testPathDirs.map(_verifyIsGitRepository);
      Q.all(testPathDirsAreGit).then(function(results) {
        if (!results.every(function(result) { return result; })) {
          console.error(
            'It appears that one of your testPathDirs does not exist ' +
            'with in a git repository. Currently --onlyChanged only works ' +
            'with git projects.\n'
          );
          process.exit(1);
        }

        return Q.all(config.testPathDirs.map(_findChangedFiles));
      }).then(function(changedPathSets) {
        // Collapse changed files from each of the testPathDirs into a single list
        // of changed file paths
        var changedPaths = [];
        changedPathSets.forEach(function(pathSet) {
          changedPaths = changedPaths.concat(pathSet);
        });
        return testRunner.findTestsRelatedTo(changedPaths);
      }).done(function(affectedTestPaths) {
        if (affectedTestPaths.length > 0) {
          _runTestsOnPathPattern(new RegExp(affectedTestPaths.join('|'))).done();
        } else {
          console.log('No tests to run!');
        }
      });
    } else {
      _runTestsOnPathPattern(pathPattern).done();
    }
  });
}

function _main() {
  var argv = optimist
    .usage('Usage: $0 [--config=<pathToConfigFile>] [TestPathRegExp]')
    .options({
      config: {
        alias: 'c',
        description: _wrapDesc(
          'The path to a jest config file specifying how to find and execute ' +
          'tests.'
        ),
        type: 'string'
      },
      coverage: {
        description: _wrapDesc(
          'Indicates that test coverage information should be collected and ' +
          'reported in the output.'
        ),
        type: 'boolean'
      },
      maxWorkers: {
        alias: 'w',
        description: _wrapDesc(
          'Specifies the maximum number of workers the worker-pool will spawn ' +
          'for running tests. This defaults to the number of the cores ' +
          'available on your machine. (its usually best not to override this ' +
          'default)'
        ),
        type: 'string' // no, optimist -- its a number.. :(
      },
      onlyChanged: {
        alias: 'o',
        description: _wrapDesc(
          'Attempts to identify which tests to run based on which files have ' +
          'changed in the current repository. Only works if you\'re running ' +
          'tests in a git repository at the moment.'
        ),
        type: 'boolean'
      },
      runInBand: {
        alias: 'i',
        description: _wrapDesc(
          'Run all tests serially in the current process (rather than creating ' +
          'a worker pool of child processes that run tests). This is sometimes ' +
          'useful for debugging, but such use cases are pretty rare.'
        ),
        type: 'boolean'
      },
      version: {
        alias: 'v',
        description: _wrapDesc('Print the version and exit'),
        type: 'boolean'
      }
    })
    .check(function(argv) {
      if (argv.runInBand && argv.hasOwnProperty('maxWorkers')) {
        throw (
          "Both --runInBand and --maxWorkers were specified, but these two " +
          "options don't make sense together. Which is it?"
        );
      }

      if (argv.onlyChanged && argv._.length > 0) {
        throw (
          "Both --onlyChanged and a path pattern were specified, but these two " +
          "options don't make sense together. Which is it? Do you want to run " +
          "tests for changed files? Or for a specific set of files?"
        );
      }
    })
    .argv

  if (argv.help) {
    optimist.showHelp();
    process.exit(0);
  }

  var cwd = process.cwd();

  // Is the cwd somewhere within an npm package?
  var cwdPackageRoot = cwd;
  while (!fs.existsSync(path.join(cwdPackageRoot, 'package.json'))) {
    if (cwdPackageRoot === '/') {
      cwdPackageRoot = cwd;
      break;
    }
    cwdPackageRoot = path.resolve(cwdPackageRoot, '..');
  }

  // Is there a package.json at our cwdPackageRoot that indicates that there
  // should be a version of Jest installed?
  var cwdPkgJsonPath = path.join(cwdPackageRoot, 'package.json');

  // Is there a version of Jest installed at our cwdPackageRoot?
  var cwdJestBinPath = path.join(
    cwdPackageRoot,
    'node_modules',
    'jest-cli',
    'bin',
    'jest.js'
  );

  // If a version of Jest was found installed in the CWD package, run using that
  if (fs.existsSync(cwdJestBinPath)) {
    var jestBinary = require(cwdJestBinPath);
    if (!jestBinary.runCLI) {
      console.error(
        'This project requires an older version of Jest than what you have ' +
        'installed globally.\n' +
        'Please upgrade this project past Jest version 0.1.5'
      );
      process.exit(1);
    }

    jestBinary.runCLI(argv, cwdPackageRoot);
    return;
  }

  // If a package.json was found in the CWD package indicating a specific
  // version of Jest to be used, bail out and ask the user to `npm install`
  // first
  if (fs.existsSync(cwdPkgJsonPath)) {
    var cwdPkgJson = require(cwdPkgJsonPath);
    var cwdPkgDeps = cwdPkgJson.dependencies;
    var cwdPkgDevDeps = cwdPkgJson.devDependencies;

    var thisJestVersion = _getJestVersion();

    if (cwdPkgDeps && cwdPkgDeps['jest-cli']
        || cwdPkgDevDeps && cwdPkgDevDeps['jest-cli']) {
      console.error(
        'Please run `npm install` to use the version of Jest intended for ' +
        'this project.'
      );
      process.exit(1);
    }
  }

  if (!argv.version && cwdPackageRoot) {
    console.log('Using Jest CLI v' + _getJestVersion());
  }
  runCLI(argv, cwdPackageRoot);
}

exports.runCLI = runCLI;

if (require.main === module) {
  harmonize();
  _main();
}
