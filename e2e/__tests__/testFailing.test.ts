/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';

skipSuiteOnJasmine();

const dir = path.resolve(__dirname, '../test-failing');

test('works with all statuses', () => {
  const result = runJest(dir, ['statuses.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('works with only mode', () => {
  const result = runJest(dir, ['worksWithOnlyMode.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('works with skip mode', () => {
  const result = runJest(dir, ['worksWithSkipMode.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('works with concurrent mode', () => {
  const result = runWithJson(dir, ['worksWithConcurrentMode.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});

test('works with concurrent and only mode', () => {
  const result = runWithJson(dir, ['worksWithConcurrentOnlyMode.test.js']);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});
