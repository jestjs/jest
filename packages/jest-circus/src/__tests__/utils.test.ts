/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';
import {ROOT_DESCRIBE_BLOCK_NAME} from '../state';
import {makeDescribe, makeSingleTestResult, makeTest} from '../utils';

const makeFailedTestResult = (error: Error) => {
  const rootDescribe = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
  const test = makeTest(
    () => {},
    undefined,
    false,
    'fails with cause',
    rootDescribe,
    undefined,
    new Error('async error'),
    false,
  );

  test.errors.push(error);
  test.status = 'done';

  return makeSingleTestResult(test);
};

test('makeTestResults does not thrown a stack overflow exception', () => {
  let testString = 'describe("top level describe", () => {';
  const numberOfTestBlocks = 150_000;
  let currentTestIndex = 0;

  while (currentTestIndex < numberOfTestBlocks) {
    testString += `test("should do something #${currentTestIndex++}", () => {});`;
  }

  testString += '})';

  const {stdout} = runTest(testString);

  expect(stdout.split('\n')).toHaveLength(900_010);
});

test('makeSingleTestResult serializes nested Error.cause', () => {
  const error = new Error('error during f', {
    cause: new Error('error during g'),
  });

  const result = makeFailedTestResult(error);

  expect(result.errors[0]).toContain('[cause]: Error: error during g');
});

test('makeSingleTestResult serializes string Error.cause', () => {
  const error = new Error('error during f', {cause: 'here is the cause'});

  const result = makeFailedTestResult(error);

  expect(result.errors[0]).toContain('[cause]: here is the cause');
});

test('makeSingleTestResult protects against circular Error.cause', () => {
  const error = new Error('error during f') as Error & {cause?: unknown};
  error.cause = error;

  const result = makeFailedTestResult(error);

  expect(result.errors[0]).toContain('[Circular cause]');
});
