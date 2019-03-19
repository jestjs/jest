/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import {wrap} from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {extractSummary} from '../Utils';
const dir = path.resolve(__dirname, '../test-todo');

test('works with all statuses', () => {
  const result = runJest(dir, ['statuses.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(wrap(rest)).toMatchSnapshot();
});

test('shows error messages when called with no arguments', () => {
  const result = runJest(dir, ['todoNoArgs.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(wrap(rest)).toMatchSnapshot();
});

test('shows error messages when called with multiple arguments', () => {
  const result = runJest(dir, ['todoMultipleArgs.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(wrap(rest)).toMatchSnapshot();
});

test('shows error messages when called with invalid argument', () => {
  const result = runJest(dir, ['todoNonString.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(wrap(rest)).toMatchSnapshot();
});

test('shows todo messages when in verbose mode', () => {
  const result = runJest(dir, ['verbose.test.js', '--verbose']);
  expect(result.status).toBe(0);
  const {rest} = extractSummary(result.stderr);
  expect(wrap(rest)).toMatchSnapshot();
});
