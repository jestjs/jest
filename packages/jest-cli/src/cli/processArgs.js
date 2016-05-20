/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const optimist = require('optimist');

function _wrapDesc(desc) {
  const indent = '\n      ';
  return indent + desc.split(' ').reduce((wrappedDesc, word) => {
    const lastLineIdx = wrappedDesc.length - 1;
    const lastLine = wrappedDesc[lastLineIdx];

    const appendedLastLine = lastLine === '' ? word : (lastLine + ' ' + word);

    if (appendedLastLine.length > 80) {
      wrappedDesc.push(word);
    } else {
      wrappedDesc[lastLineIdx] = appendedLastLine;
    }

    return wrappedDesc;
  }, ['']).join(indent);
}

function processArgs() {
  return optimist
    .usage('Usage: $0 [--config=<pathToConfigFile>] [TestPathRegExp]')
    .options({
      config: {
        alias: 'c',
        description: _wrapDesc(
          'The path to a jest config file specifying how to find and execute ' +
          'tests. If no rootDir is set in the config, the current directory ' +
          'is assumed to be the rootDir for the project.'
        ),
        type: 'string',
      },
      coverage: {
        description: _wrapDesc(
          'Indicates that test coverage information should be collected and ' +
          'reported in the output.'
        ),
        type: 'boolean',
      },
      maxWorkers: {
        alias: 'w',
        description: _wrapDesc(
          'Specifies the maximum number of workers the worker-pool will ' +
          'spawn for running tests. This defaults to the number of the cores ' +
          'available on your machine. (its usually best not to override this ' +
          'default)'
        ),
        type: 'string', // no, optimist -- its a number.. :(
      },
      onlyChanged: {
        alias: 'o',
        description: _wrapDesc(
          'Attempts to identify which tests to run based on which files have ' +
          'changed in the current repository. Only works if you\'re running ' +
          'tests in a git repository at the moment.'
        ),
        type: 'boolean',
      },
      runInBand: {
        alias: 'i',
        description: _wrapDesc(
          'Run all tests serially in the current process (rather than ' +
          'creating a worker pool of child processes that run tests). This ' +
          'is sometimes useful for debugging, but such use cases are pretty ' +
          'rare.'
        ),
        type: 'boolean',
      },
      testEnvData: {
        description: _wrapDesc(
          'A JSON object (string) that specifies data that will be made ' +
          'available in the test environment (via jest.getTestEnvData())'
        ),
        type: 'string',
      },
      testPathPattern: {
        description: _wrapDesc(
          'A regexp pattern string that is matched against all tests ' +
          'paths before executing the test.'
        ),
        type: 'string',
      },
      version: {
        alias: 'v',
        description: _wrapDesc('Print the version and exit'),
        type: 'boolean',
      },
      noHighlight: {
        description: _wrapDesc(
          'Disables test results output highlighting'
        ),
        type: 'boolean',
      },
      colors: {
        description: _wrapDesc(
          'Forces test results output highlighting (even if stdout is not a TTY)'
        ),
        type: 'boolean',
      },
      noStackTrace: {
        description: _wrapDesc(
          'Disables stack trace in test results output'
        ),
        type: 'boolean',
      },
      verbose: {
        description: _wrapDesc(
          'Display individual test results with the test suite hierarchy.'
        ),
        type: 'boolean',
      },
      watch: {
        description: _wrapDesc(
          'Watch files for changes and rerun tests related to changed files. ' +
          'If you want to re-run all tests when a file has changed, you can ' +
          'call Jest using `--watch=all`.'
        ),
        type: 'string',
      },
      bail: {
        alias: 'b',
        description: _wrapDesc(
          'Exit the test suite immediately upon the first failing test.'
        ),
        type: 'boolean',
      },
      useStderr: {
        description: _wrapDesc(
          'Divert all output to stderr.'
        ),
        type: 'boolean',
      },
      cache: {
        default: true,
        description: _wrapDesc(
          'Whether to use the preprocessor cache. Disable the cache using ' +
          '--no-cache.'
        ),
        type: 'boolean',
      },
      json: {
        description: _wrapDesc(
          'Prints the test results in JSON. This mode will send all ' +
          'other test output and user messages to stderr.'
        ),
        type: 'boolean',
      },
      setupTestFrameworkScriptFile: {
        description: _wrapDesc(
          'The path to a module that runs some code to configure or set up ' +
          'the testing framework before each test.'
        ),
        type: 'string',
      },
      testRunner: {
        description: _wrapDesc(
          'Allows to specify a custom test runner. Jest ships with Jasmine ' +
          '1 and 2 which can be enabled by setting this option to ' +
          '`jasmine1` or `jasmine2`. The default is `jasmine2`. A path to a ' +
          'custom test runner can be provided: ' +
          '`<rootDir>/path/to/testRunner.js`.'
        ),
        type: 'string',
      },
      logHeapUsage: {
        description: _wrapDesc(
          'Logs the heap usage after every test. Useful to debug memory ' +
          'leaks. Use together with `--runInBand` and `--expose-gc` in node.'
        ),
        type: 'boolean',
      },
      watchman: {
        default: true,
        description: _wrapDesc(
          'Whether to use watchman for file crawling. Disable using ' +
          '--no-watchman.'
        ),
        type: 'boolean',
      },
      silent: {
        default: false,
        description: _wrapDesc(
          'Prevent tests from printing messages through the console.'
        ),
        type: 'boolean',
      },
    })
    .check(argv => {
      if (argv.runInBand && argv.hasOwnProperty('maxWorkers')) {
        throw new Error(
          'Both --runInBand and --maxWorkers were specified, but these two ' +
          'options do not make sense together. Which is it?'
        );
      }

      if (argv.onlyChanged && argv._.length > 0) {
        throw new Error(
          'Both --onlyChanged and a path pattern were specified, but these ' +
          'two options do not make sense together. Which is it? Do you want ' +
          'to run tests for changed files? Or for a specific set of files?'
        );
      }

      if (argv.watchExtensions && argv.watch === undefined) {
        throw new Error(
          '--watchExtensions can only be specified together with --watch.'
        );
      }

      if (argv.testEnvData) {
        argv.testEnvData = JSON.parse(argv.testEnvData);
      }
    })
    .argv;
}

module.exports = processArgs;
