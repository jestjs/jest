/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary, runYarnInstall} from '../Utils';
import runJest from '../runJest';

test('console printing', () => {
  const {stderr, exitCode} = runJest('console');
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('console printing with --verbose', () => {
  const {stderr, stdout, exitCode} = runJest('console', [
    '--verbose',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('does not print to console with --silent', () => {
  const {stderr, stdout, exitCode} = runJest('console', [
    // Need to pass --config because console test specifies `verbose: false`
    `--config=${JSON.stringify({
      testEnvironment: 'node',
    })}`,
    '--silent',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('respects --noStackTrace', () => {
  const {stderr, stdout, exitCode} = runJest('console', [
    // Need to pass --config because console test specifies `verbose: false`
    `--config=${JSON.stringify({
      testEnvironment: 'node',
    })}`,
    '--noStackTrace',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('respects noStackTrace in config', () => {
  const {stderr, stdout, exitCode} = runJest('console', [
    // Need to pass --config because console test specifies `verbose: false`
    `--config=${JSON.stringify({
      noStackTrace: true,
      testEnvironment: 'node',
    })}`,
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

// issue: https://github.com/jestjs/jest/issues/5223
test('the jsdom console is the same as the test console', () => {
  const {stderr, stdout, exitCode} = runJest('console-jsdom');
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});

test('does not error out when using winston', () => {
  const dir = path.resolve(__dirname, '../console-winston');
  runYarnInstall(dir);
  const {stderr, stdout, exitCode} = runJest(dir);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
