/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {wrap} from 'jest-snapshot-serializer-raw';
import {extractSummary} from '../Utils';
import runJest from '../runJest';


test('respects --noStackTrace', () => {
  const {stderr, stdout, exitCode} = runJest('console', [
    // Need to pass --config because console test specifies `verbose: false`
    '--config=' +
      JSON.stringify({
        testEnvironment: 'node',
      }),
    '--noStackTrace',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});

test('respects noStackTrace in config', () => {
  const {stderr, stdout, exitCode} = runJest('console', [
    // Need to pass --config because console test specifies `verbose: false`
    '--config=' +
      JSON.stringify({
        noStackTrace: true,
        testEnvironment: 'node',
      }),
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(wrap(stdout)).toMatchSnapshot();
  expect(wrap(rest)).toMatchSnapshot();
  expect(wrap(summary)).toMatchSnapshot();
});
