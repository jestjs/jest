/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSortedSummary} from '../Utils';
import runJest from '../runJest';

test('Verbose Reporter', () => {
  const {exitCode, stderr} = runJest('verbose-reporter');

  expect(exitCode).toBe(1);
  expect(stderr).toMatch('works just fine');
  expect(stderr).toMatch('does not work');
  expect(stderr).toMatch(/Verbose\n.*?works/);
});

test('per-project verbose and silent', () => {
  const {exitCode, stderr} = runJest('verbose-per-project');

  expect(exitCode).toBe(0);
  const {rest, summary} = extractSortedSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
