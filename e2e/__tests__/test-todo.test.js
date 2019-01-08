/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import path from 'path';
import runJest from '../runJest';
import {extractSummary} from '../Utils';
const dir = path.resolve(__dirname, '../test-todo');

test('works with all statuses', () => {
  const result = runJest(dir, ['statuses.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows error messages when called with no arguments', () => {
  const result = runJest(dir, ['todo_no_args.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows error messages when called with multiple arguments', () => {
  const result = runJest(dir, ['todo_multiple_args.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('shows error messages when called with invalid argument', () => {
  const result = runJest(dir, ['todo_non_string.test.js']);
  expect(result.status).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});
