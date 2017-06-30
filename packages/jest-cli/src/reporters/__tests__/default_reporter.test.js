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
  testFilePath: '/foo',
};

let DefaultReporter;
let stdout;
let stderr;

let oldIsTTY;
let oldStderr;
let oldStdout;

beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers();

  oldIsTTY = process.stdin.isTTY;
  oldStdout = process.stdout.write;
  oldStderr = process.stderr.write;

  // We mock stderr (even if we do not use it right now on the tests) to avoid
  // fake reporters created while testing to mess with the real output of the
  // tests itself.
  process.stdin.isTTY = true;
  stdout = process.stdout.write = jest.fn();
  stderr = process.stderr.write = jest.fn();

  DefaultReporter = require('../default_reporter');
});

afterEach(() => {
  process.stdin.isTTY = oldIsTTY;
  process.stdout.write = oldStdout;
  process.stderr.write = oldStderr;
});

test('normal output, everything goes to stdout', () => {
  const reporter = new DefaultReporter({});

  reporter.onRunStart(aggregatedResults, options);
  reporter.onTestStart(testCase);
  reporter.onTestResult(testCase, testResult, aggregatedResults);;
  reporter.onRunComplete();

  jest.runAllTimers();

  expect(stdout).toHaveBeenCalled();
});

test('when using stderr as output, no stdout call is made', () => {
  const reporter = new DefaultReporter({useStderr: true});

  reporter.onRunStart(aggregatedResults, options);
  reporter.onTestStart(testCase);
  reporter.onTestResult(testCase, testResult, aggregatedResults);;
  reporter.onRunComplete();

  jest.runAllTimers();

  expect(stdout).not.toHaveBeenCalled();
});
