/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

const dir = path.resolve(__dirname, '../each');

test('works with passing tests', () => {
  const result = runJest(dir, ['success.test.js']);
  expect(result.exitCode).toBe(0);
});

test('shows error message when not enough arguments are supplied to tests', () => {
  const result = runJest(dir, ['eachException.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows the correct errors in stderr when failing tests', () => {
  const result = runJest(dir, ['failure.test.js']);
  expect(result.exitCode).toBe(1);
  const output = extractSummary(result.stderr)
    .rest.split('\n')
    .map(line => line.trimRight())
    .join('\n');
  expect(output).toMatchSnapshot();
});

test('shows only the tests with .only as being ran', () => {
  const result = runJest(dir, ['eachOnly.test.js']);
  expect(result.exitCode).toBe(0);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows only the tests without .skip as being ran', () => {
  const result = runJest(dir, ['eachSkip.test.js']);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
  expect(result.exitCode).toBe(0);
});

test('runs only the describe.only.each tests', () => {
  const result = runJest(dir, ['describeOnly.test.js']);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
  expect(result.exitCode).toBe(0);
});

test('formats args with pretty format when given %p', () => {
  const result = runJest(dir, ['pretty.test.js']);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
  expect(result.exitCode).toBe(0);
});
