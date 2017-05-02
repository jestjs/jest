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
        'Example usage: jest --findRelatedTests ./src/source.js ' +
        './src/index.js.',
    );
  }

  return true;
};

const usage = 'Usage: $0 [--config=<pathToConfigFile>] [TestPathPattern]';
const docs = 'Documentation: https://facebook.github.io/jest/';

const options = {
  automock: {
    default: undefined,
    description: 'Automock all files by default.',
    type: 'boolean',
  },
  bail: {
    alias: 'b',
    default: undefined,
    description: 'Exit the test suite immediately upon the first failing test.',
    type: 'boolean',
  },
  browser: {
    default: undefined,
    description: 'Respect Browserify\'s "browser" field in package.json ' +
      'when resolving modules. Some modules export different versions ' +
      'based on whether they are operating in Node or a browser.',
    type: 'boolean',
  },
  cache: {
    default: undefined,
    description: 'Whether to use the transform cache. Disable the cache ' +
      'using --no-cache.',
    type: 'boolean',
  },
  cacheDirectory: {
    description: 'The directory where Jest should store its cached ' +
      ' dependency information.',
    type: 'string',
  },
  clearMocks: {
    default: undefined,
    description: 'Automatically clear mock calls and instances between every ' +
      'test. Equivalent to calling jest.clearAllMocks() between each test.',
    type: 'boolean',
  },
  collectCoverage: {
    default: undefined,
    description: 'Alias for --coverage.',
    type: 'boolean',
  },
  collectCoverageFrom: {
    description: 'relative to <rootDir> glob pattern matching the files ' +
      'that coverage info needs to be collected from.',
    type: 'string',
  },
  collectCoverageOnlyFrom: {
    description: 'List of paths coverage will be restricted to.',
    type: 'array',
  },
  color: {
    default: undefined,
    description: 'Forces test results output color highlighting (even if ' +
      'stdout is not a TTY). Set to false if you would like to have no colors.',
    type: 'boolean',
  },
  colors: {
    default: undefined,
    description: 'Alias for `--color`.',
    type: 'boolean',
  },
  config: {
    alias: 'c',
    description: 'The path to a jest config file specifying how to find ' +
      'and execute tests. If no rootDir is set in the config, the current ' +
      'directory is assumed to be the rootDir for the project. This can also ' +
      'be a JSON encoded value which Jest will use as configuration.',
    type: 'string',
  },
  coverage: {
    default: undefined,
    description: 'Indicates that test coverage information should be ' +
      'collected and reported in the output.',
    type: 'boolean',
  },
  coverageDirectory: {
    description: 'The directory where Jest should output its coverage files.',
    type: 'string',
  },
  coveragePathIgnorePatterns: {
    description: 'An array of regexp pattern strings that are matched ' +
      'against all file paths before executing the test. If the file path' +
      'matches any of the patterns, coverage information will be skipped.',
    type: 'array',
  },
  coverageReporters: {
    description: 'A list of reporter names that Jest uses when writing ' +
      'coverage reports. Any istanbul reporter can be used.',
    type: 'array',
  },
  coverageThreshold: {
    description: 'A JSON string with which will be used to configure ' +
      'minimum threshold enforcement for coverage results',
    type: 'string',
  },
  debug: {
    default: undefined,
    description: 'Print debugging info about your jest config.',
    type: 'boolean',
  },
  env: {
    description: 'The test environment used for all tests. This can point to ' +
      'any file or node module. Examples: `jsdom`, `node` or ' +
      '`path/to/my-environment.js`',
    type: 'string',
  },
  expand: {
    alias: 'e',
    default: undefined,
    description: 'Use this flag to show full diffs instead of a patch.',
    type: 'boolean',
  },
  findRelatedTests: {
    default: undefined,
    description: 'Find related tests for a list of source files that were ' +
      'passed in as arguments. Useful for pre-commit hook integration to run ' +
      'the minimal amount of tests necessary.',
    type: 'boolean',
  },
  forceExit: {
    default: undefined,
    description: 'Force Jest to exit after all tests have completed running. ' +
      'This is useful when resources set up by test code cannot be ' +
      'adequately cleaned up.',
    type: 'boolean',
  },
  globals: {
    description: 'A JSON string with map of global variables that need ' +
      'to be available in all test environments.',
    type: 'string',
  },
  haste: {
    description: "A JSON string with map of variables for Facebook's " +
      '@providesModule module system',
    type: 'string',
  },
  json: {
    default: undefined,
    description: 'Prints the test results in JSON. This mode will send all ' +
      'other test output and user messages to stderr.',
    type: 'boolean',
  },
  lastCommit: {
    default: undefined,
    description: 'Will run all tests affected by file changes in the last ' +
      'commit made.',
    type: 'boolean',
  },
  logHeapUsage: {
    default: undefined,
    description: 'Logs the heap usage after every test. Useful to debug ' +
      'memory leaks. Use together with `--runInBand` and `--expose-gc` in ' +
      'node.',
    type: 'boolean',
  },
  mapCoverage: {
    default: undefined,
    description: 'Maps code coverage reports against original source code ' +
      'when transformers supply source maps.',
    type: 'boolean',
  },
  maxWorkers: {
    alias: 'w',
    description: 'Specifies the maximum number of workers the worker-pool ' +
      'will spawn for running tests. This defaults to the number of the ' +
      'cores available on your machine. (its usually best not to override ' +
      'this default)',
    type: 'number',
  },
  moduleDirectories: {
    description: 'An array of directory names to be searched recursively ' +
      "up from the requiring module's location.",
    type: 'array',
  },
  moduleFileExtensions: {
    description: 'An array of file extensions your modules use. If you ' +
      'require modules without specifying a file extension, these are the ' +
      'extensions Jest will look for. ',
    type: 'array',
  },
  moduleNameMapper: {
    description: 'A JSON string with a map from regular expressions to ' +
      'module names that allow to stub out resources, like images or ' +
      'styles with a single module',
    type: 'string',
  },
  modulePathIgnorePatterns: {
    description: 'An array of regexp pattern strings that are matched ' +
      'against all module paths before those paths are to be considered ' +
      '"visible" to the module loader.',
    type: 'array',
  },
  modulePaths: {
    description: 'An alternative API to setting the NODE_PATH env variable, ' +
      'modulePaths is an array of absolute paths to additional locations to ' +
      'search when resolving modules.',
    type: 'array',
  },
  noStackTrace: {
    default: undefined,
    description: 'Disables stack trace in test results output',
    type: 'boolean',
  },
  notify: {
    default: undefined,
    description: 'Activates notifications for test results.',
    type: 'boolean',
  },
  onlyChanged: {
    alias: 'o',
    default: undefined,
    description: 'Attempts to identify which tests to run based on which ' +
      "files have changed in the current repository. Only works if you're " +
      'running tests in a git repository at the moment.',
    type: 'boolean',
  },
  outputFile: {
    description: 'Write test results to a file when the --json option is ' +
      'also specified.',
    type: 'string',
  },
  preset: {
    description: "A preset that is used as a base for Jest's configuration.",
    type: 'string',
  },
  projects: {
    description: 'A list of projects that use Jest to run all tests of all ' +
      'projects in a single instance of Jest.',
    type: 'array',
  },
  resetMocks: {
    default: undefined,
    description: 'Automatically reset mock state between every test. ' +
      'Equivalent to calling jest.resetAllMocks() between each test.',
    type: 'boolean',
  },
  resetModules: {
    default: undefined,
    description: 'If enabled, the module registry for every test file will ' +
      'be reset before running each individual test.',
    type: 'boolean',
  },
  resolver: {
    description: 'A JSON string which allows the use of a custom resolver.',
    type: 'string',
  },
  rootDir: {
    description: 'The root directory that Jest should scan for tests and ' +
      'modules within.',
    type: 'string',
  },
  roots: {
    description: 'A list of paths to directories that Jest should use to ' +
      'search for files in.',
    type: 'array',
  },
  runInBand: {
    alias: 'i',
    default: undefined,
    description: 'Run all tests serially in the current process (rather than ' +
      'creating a worker pool of child processes that run tests). This ' +
      'is sometimes useful for debugging, but such use cases are pretty ' +
      'rare.',
    type: 'boolean',
  },
  setupFiles: {
    description: 'The paths to modules that run some code to configure or ' +
      'set up the testing environment before each test. ',
    type: 'array',
  },
  setupTestFrameworkScriptFile: {
    description: 'The path to a module that runs some code to configure or ' +
      'set up the testing framework before each test.',
    type: 'string',
  },
  showConfig: {
    default: undefined,
    description: 'Print your jest config and then exits.',
    type: 'boolean',
  },
  silent: {
    default: undefined,
    description: 'Prevent tests from printing messages through the console.',
    type: 'boolean',
  },
  snapshotSerializers: {
    description: 'A list of paths to snapshot serializer modules Jest should ' +
      'use for snapshot testing.',
    type: 'array',
  },
  testEnvironment: {
    description: 'Alias for --env',
    type: 'string',
  },
  testMatch: {
    description: 'The glob patterns Jest uses to detect test files.',
    type: 'array',
  },
  testNamePattern: {
    alias: 't',
    description: 'Run only tests with a name that matches the regex pattern.',
    type: 'string',
  },
  testPathIgnorePatterns: {
    description: 'An array of regexp pattern strings that are matched ' +
      'against all test paths before executing the test. If the test path ' +
      'matches any of the patterns, it will be skipped.',
    type: 'array',
  },
  testPathPattern: {
    description: 'A regexp pattern string that is matched against all tests ' +
      'paths before executing the test.',
    type: 'string',
  },
  testRegex: {
    description: 'The regexp pattern Jest uses to detect test files.',
    type: 'string',
  },
  testResultsProcessor: {
    description: 'Allows the use of a custom results processor. ' +
      'This processor must be a node module that exports ' +
      'a function expecting as the first argument the result object',
    type: 'string',
  },
  testRunner: {
    description: 'Allows to specify a custom test runner. The default is ' +
      ' `jasmine2`. A path to a custom test runner can be provided: ' +
      '`<rootDir>/path/to/testRunner.js`.',
    type: 'string',
  },
  testURL: {
    description: 'This option sets the URL for the jsdom environment.',
    type: 'string',
  },
  timers: {
    description: 'Setting this value to fake allows the use of fake timers ' +
      'for functions such as setTimeout.',
    type: 'string',
  },
  transform: {
    description: 'A JSON string which maps from regular expressions to paths ' +
      'to transformers.',
    type: 'string',
  },
  transformIgnorePatterns: {
    description: 'An array of regexp pattern strings that are matched ' +
      'against all source file paths before transformation.',
    type: 'array',
  },
  unmockedModulePathPatterns: {
    description: 'An array of regexp pattern strings that are matched ' +
      'against all modules before the module loader will automatically ' +
      'return a mock for them.',
    type: 'array',
  },
  updateSnapshot: {
    alias: 'u',
    default: undefined,
    description: 'Use this flag to re-record snapshots. ' +
      'Can be used together with a test suite pattern or with ' +
      '`--testNamePattern` to re-record snapshot for test matching ' +
      'the pattern',
    type: 'boolean',
  },
  useStderr: {
    default: undefined,
    description: 'Divert all output to stderr.',
    type: 'boolean',
  },
  verbose: {
    default: undefined,
    description: 'Display individual test results with the test suite ' +
      'hierarchy.',
    type: 'boolean',
  },
  version: {
    alias: 'v',
    default: undefined,
    description: 'Print the version and exit',
    type: 'boolean',
  },
  watch: {
    default: undefined,
    description: 'Watch files for changes and rerun tests related to ' +
      'changed files. If you want to re-run all tests when a file has ' +
      'changed, use the `--watchAll` option.',
    type: 'boolean',
  },
  watchAll: {
    default: undefined,
    description: 'Watch files for changes and rerun all tests. If you want ' +
      'to re-run only the tests related to the changed files, use the ' +
      '`--watch` option.',
    type: 'boolean',
  },
  watchman: {
    default: undefined,
    description: 'Whether to use watchman for file crawling. Disable using ' +
      '--no-watchman.',
    type: 'boolean',
  },
};

module.exports = {
  check,
  docs,
  options,
  usage,
};
