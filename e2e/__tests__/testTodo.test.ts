/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {extractSummary} from '../Utils';
import runJest from '../runJest';
const dir = path.resolve(__dirname, '../test-todo');

test('works with all statuses', () => {
  const result = runJest(dir, ['statuses.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows error messages when called with no arguments', () => {
  const result = runJest(dir, ['todoNoArgs.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows error messages when called with multiple arguments', () => {
  const result = runJest(dir, ['todoMultipleArgs.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows error messages when called with invalid argument', () => {
  const result = runJest(dir, ['todoNonString.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows todo messages when in verbose mode', () => {
  const result = runJest(dir, ['verbose.test.js', '--verbose']);
  expect(result.exitCode).toBe(0);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('counts todo tests when inside of a `describe.only`', () => {
  const result = runJest(dir, ['only-todo.test.js']);
  expect(result.exitCode).toBe(0);
  const {rest, summary} = extractSummary(result.stderr);
  expect(`${rest}\n\n${summary}`).toMatchSnapshot();
});
