/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest, {json as runWithJson} from '../runJest';

test('moduleNameMapper wrong configuration', () => {
  const {stderr, exitCode} = runJest('module-name-mapper-wrong-config');
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(1);
  expect(rest).toMatchSnapshot();
});

test('moduleNameMapper wrong array configuration', () => {
  const {stderr, exitCode} = runJest('module-name-mapper-wrong-array-config');
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(1);
  expect(rest).toMatchSnapshot();
});

test('moduleNameMapper correct configuration', () => {
  const {stderr, exitCode} = runJest('module-name-mapper-correct-config', [], {
    stripAnsi: true,
  });
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
});

test('moduleNameMapper correct configuration mocking module of absolute path', () => {
  const {stderr, exitCode} = runJest(
    'module-name-mapper-correct-mock-absolute-path',
    [],
    {
      stripAnsi: true,
    },
  );
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(rest).toMatchSnapshot();
});

test('moduleNameMapper with mocking', () => {
  const {json} = runWithJson('module-name-mapper-mock');
  expect(json.numTotalTests).toBe(2);
  expect(json.success).toBe(true);
});
