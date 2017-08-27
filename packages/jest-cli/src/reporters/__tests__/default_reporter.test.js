/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const aggregatedResults = {};
const options = {};
const testCase = {
  context: {config: {rootDir: '/'}},
  duration: 0,
  path: '/foo',
};
const testResult = {
  snapshot: {
    added: 0,
    fileDeleted: true,
    matched: 1,
    unchecked: 0,
    unmatched: 0,
    updated: 0,
  },
  testFilePath: '/foo',
};

let DefaultReporter;
let stdout;

let oldIsTTY;
let oldStderr;
let oldStdout;

beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers();

  // This is not a CI environment, which removes all output by default.
  jest.mock('is-ci', () => false);

  oldIsTTY = process.stdin.isTTY;
  oldStdout = process.stdout.write;
  oldStderr = process.stderr.write;

  // We mock stderr (even if we do not use it right now on the tests) to avoid
  // fake reporters created while testing to mess with the real output of the
  // tests itself.
  process.stdin.isTTY = true;
  process.stderr.write = jest.fn();
  stdout = process.stdout.write = jest.fn();

  DefaultReporter = require('../default_reporter');
});

afterEach(() => {
  process.stdin.isTTY = oldIsTTY;
  process.stderr.write = oldStderr;
  process.stdout.write = oldStdout;
});

test('normal output, everything goes to stdout', () => {
  const reporter = new DefaultReporter({rootDir: '', useStderr: false});

  reporter.onRunStart(aggregatedResults, options);
  reporter.onTestStart(testCase);
  reporter.onTestResult(testCase, testResult, aggregatedResults);
  reporter.onRunComplete();

  jest.runAllTimers();

  expect(stdout).toHaveBeenCalled();
});

test('when using stderr as output, no stdout call is made', () => {
  const reporter = new DefaultReporter({rootDir: '', useStderr: true});

  reporter.onRunStart(aggregatedResults, options);
  reporter.onTestStart(testCase);
  reporter.onTestResult(testCase, testResult, aggregatedResults);
  reporter.onRunComplete();

  jest.runAllTimers();

  expect(stdout).not.toHaveBeenCalled();
});
