/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {runTest} from '../__mocks__/testUtils';
import {ROOT_DESCRIBE_BLOCK_NAME} from '../state';
import {
  makeDescribe,
  makeRunResult,
  makeSingleTestResult,
  makeTest,
  parseSingleTestResult,
} from '../utils';

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

test('makeSingleTestResult serializes the inner errors of an AggregateError', () => {
  const error = new AggregateError([
    new Error('inner A'),
    new Error('inner B'),
  ]);

  const result = makeFailedTestResult(error);

  expect(result.errors[0]).toContain('[errors]: Error: inner A');
  expect(result.errors[0]).toContain('[errors]: Error: inner B');
});

test('makeSingleTestResult protects against a circular AggregateError', () => {
  const error = new AggregateError([]);
  error.errors.push(error);

  const result = makeFailedTestResult(error);

  expect(result.errors[0]).toContain('[Circular errors]');
});

test('makeSingleTestResult serializes retry reasons', () => {
  const rootDescribe = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
  const test = makeTest(
    () => {},
    undefined,
    false,
    'flaky test',
    rootDescribe,
    undefined,
    new Error('async error'),
    false,
  );

  const retryReason = new Error('flaked', {
    cause: new Error('the flake reason'),
  });
  test.retryReasons.push(retryReason);
  test.errors.push(new Error('failed for good'));
  test.status = 'done';

  const result = makeSingleTestResult(test);

  expect(result.retryReasons[0]).toContain('Error: flaked');
  expect(result.retryReasons[0]).toContain('[cause]: Error: the flake reason');
  expect(result.retryReasonsDetailed[0]).toBe(retryReason);

  // The per-test-case result reports the same retries, rendered by the caller
  // that owns the config.
  expect(
    parseSingleTestResult(result, error => `rendered: ${error.message}`)
      .retryMessages,
  ).toEqual(['rendered: flaked']);
});

test('makeRunResult keeps the unserialized unhandled errors', () => {
  const error = new Error('unhandled');
  const result = makeRunResult(makeDescribe(ROOT_DESCRIBE_BLOCK_NAME), [error]);

  expect(result.unhandledErrorsDetailed[0]).toBe(error);
  expect(result.unhandledErrors[0]).toBe(error.stack);
});
