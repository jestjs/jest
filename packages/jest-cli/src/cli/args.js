/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const check = (argv: Object) => {
  if (argv.runInBand && argv.hasOwnProperty('maxWorkers')) {
    throw new Error(
      'Both --runInBand and --maxWorkers were specified, but these two ' +
      'options do not make sense together. Which is it?',
    );
  }

  if (argv.onlyChanged && argv._.length > 0) {
    throw new Error(
      'Both --onlyChanged and a path pattern were specified, but these ' +
      'two options do not make sense together. Which is it? Do you want ' +
      'to run tests for changed files? Or for a specific set of files?',
    );
  }

  if (argv.onlyChanged && argv.watchAll) {
    throw new Error(
      'Both --onlyChanged and --watchAll were specified, but these two ' +
      'options do not make sense together. Try the --watch option which ' +
      'reruns only tests related to changed files.',
    );
  }

  if (argv.findRelatedTests && argv._.length === 0) {
    throw new Error(
      'The --findRelatedTests option requires file paths to be specified.\n' +
      'Example usage: jest --findRelatedTests ./src/source.js ./src/index.js.',
    );
  }

  return true;
};

const usage = 'Usage: $0 [--config=<pathToConfigFile>] [TestPathPattern]';

const options = {
  bail: {
    alias: 'b',
    description:
      'Exit the test suite immediately upon the first failing test.',
    type: 'boolean',
  },
  cache: {
    default: true,
    description:
      'Whether to use the transform cache. Disable the cache using ' +
      '--no-cache.',
    type: 'boolean',
  },
  collectCoverageFrom: {
    description:
      'relative to <rootDir> glob pattern matching the files that coverage ' +
      'info needs to be collected from.',
    type: 'string',
  },
  collectCoverageOnlyFrom: {
    description: 'List of paths coverage will be restricted to.',
    type: 'array',
  },
  color: {
    description:
      'Forces test results output color highlighting (even if stdout is not ' +
      'a TTY). Set to false if you would like to have no colors.',
    type: 'boolean',
  },
  colors: {
    description:
      'Alias for `--color`.',
    type: 'boolean',
  },
  config: {
    alias: 'c',
    description:
      'The path to a jest config file specifying how to find and execute ' +
      'tests. If no rootDir is set in the config, the current directory ' +
      'is assumed to be the rootDir for the project. This can also be a JSON' +
      'encoded value which Jest will use as configuration.',
    type: 'string',
  },
  coverage: {
    description:
      'Indicates that test coverage information should be collected and ' +
      'reported in the output.',
    type: 'boolean',
  },
  coverageDirectory: {
    default: undefined,
    description: 'The directory where Jest should output its coverage files.',
    type: 'string',
  },
  debug: {
    description: 'Print debugging info about your jest config.',
    type: 'boolean',
  },
  env: {
    default: undefined,
    description:
      'The test environment used for all tests. This can point to any file ' +
      'or node module. Examples: `jsdom`, `node` or ' +
      '`path/to/my-environment.js`',
    type: 'string',
  },
  expand: {
    alias: 'e',
    default: false,
    description: 'Use this flag to show full diffs instead of a patch.',
    type: 'boolean',
  },
  findRelatedTests: {
    description:
      'Find related tests for a list of source files that were passed in ' +
      'as arguments. Useful for pre-commit hook integration to run the ' +
      'minimal amount of tests necessary.',
    type: 'boolean',
  },
  forceExit: {
    default: false,
    description:
      'Force Jest to exit after all tests have completed running. ' +
      'This is useful when resources set up by test code cannot be ' +
      'adequately cleaned up.',
    type: 'boolean',
  },
  json: {
    description:
      'Prints the test results in JSON. This mode will send all ' +
      'other test output and user messages to stderr.',
    type: 'boolean',
  },
  lastCommit: {
    default: false,
    description:
      'Will run all tests affected by file changes in the last commit made.',
    type: 'boolean',
  },
  logHeapUsage: {
    description:
      'Logs the heap usage after every test. Useful to debug memory ' +
      'leaks. Use together with `--runInBand` and `--expose-gc` in node.',
    type: 'boolean',
  },
  maxWorkers: {
    alias: 'w',
    description:
      'Specifies the maximum number of workers the worker-pool will ' +
      'spawn for running tests. This defaults to the number of the cores ' +
      'available on your machine. (its usually best not to override this ' +
      'default)',
    type: 'string', // no, yargs -- its a number.. :(
  },
  noStackTrace: {
    description: 'Disables stack trace in test results output',
    type: 'boolean',
  },
  notify: {
    description: 'Activates notifications for test results.',
    type: 'boolean',
  },
  onlyChanged: {
    alias: 'o',
    description:
      'Attempts to identify which tests to run based on which files have ' +
      'changed in the current repository. Only works if you\'re running ' +
      'tests in a git repository at the moment.',
    type: 'boolean',
  },
  outputFile: {
    description:
      'Write test results to a file when the --json option is also specified.',
    type: 'string',
  },
  runInBand: {
    alias: 'i',
    description:
      'Run all tests serially in the current process (rather than ' +
      'creating a worker pool of child processes that run tests). This ' +
      'is sometimes useful for debugging, but such use cases are pretty ' +
      'rare.',
    type: 'boolean',
  },
  setupTestFrameworkScriptFile: {
    description:
      'The path to a module that runs some code to configure or set up ' +
      'the testing framework before each test.',
    type: 'string',
  },
  silent: {
    default: false,
    description: 'Prevent tests from printing messages through the console.',
    type: 'boolean',
  },
  testNamePattern: {
    alias: 't',
    description:
      'Run only tests with a name that matches the regex pattern.',
    type: 'string',
  },
  testPathPattern: {
    description:
      'A regexp pattern string that is matched against all tests ' +
      'paths before executing the test.',
    type: 'string',
  },
  testResultsProcessor: {
    default: undefined,
    description:
      'Allows the use of a custom results processor. ' +
      'This processor must be a node module that exports ' +
      'a function expecting as the first argument the result object',
    type: 'string',
  },
  testRunner: {
    description:
      'Allows to specify a custom test runner. Jest ships with Jasmine ' +
      '1 and 2 which can be enabled by setting this option to ' +
      '`jasmine1` or `jasmine2`. The default is `jasmine2`. A path to a ' +
      'custom test runner can be provided: ' +
      '`<rootDir>/path/to/testRunner.js`.',
    type: 'string',
  },
  updateSnapshot: {
    alias: 'u',
    default: false,
    description:
      'Use this flag to re-record snapshots. ' +
      'Can be used together with a test suite pattern or with ' +
      '`--testNamePattern` to re-record snapshot for test matching ' +
      'the pattern',
    type: 'boolean',
  },
  useStderr: {
    description: 'Divert all output to stderr.',
    type: 'boolean',
  },
  verbose: {
    description:
      'Display individual test results with the test suite hierarchy.',
    type: 'boolean',
  },
  version: {
    alias: 'v',
    description:'Print the version and exit',
    type: 'boolean',
  },
  watch: {
    description:
      'Watch files for changes and rerun tests related to changed files. ' +
      'If you want to re-run all tests when a file has changed, use the ' +
      '`--watchAll` option.',
    type: 'boolean',
  },
  watchAll: {
    description:
      'Watch files for changes and rerun all tests. If you want to re-run ' +
       'only the tests related to the changed files, use the ' +
      '`--watch` option.',
    type: 'boolean',
  },
  watchman: {
    default: true,
    description:
      'Whether to use watchman for file crawling. Disable using ' +
      '--no-watchman.',
    type: 'boolean',
  },
};

module.exports = {
  check,
  options,
  usage,
};
