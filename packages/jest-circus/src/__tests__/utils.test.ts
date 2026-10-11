/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Circus} from '@jest/types';
import {runTest} from '../__mocks__/testUtils';
import {ROOT_DESCRIBE_BLOCK_NAME} from '../state';
import {
  callAsyncCircusFn,
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

test('makeSingleTestResult keeps primitive retry errors independent', () => {
  const rootDescribe = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
  const asyncError = new Error('hook location');
  const test = makeTest(
    () => {},
    undefined,
    false,
    'primitive hook errors',
    rootDescribe,
    undefined,
    asyncError,
    false,
  );

  test.retryReasons.push(['first primitive', asyncError]);
  test.errors.push(['second primitive', asyncError]);
  test.status = 'done';

  const result = makeSingleTestResult(test);

  expect(result.retryReasons[0]).toContain('first primitive');
  expect(result.retryReasons[0]).not.toContain('second primitive');
  expect(result.errors[0]).toContain('second primitive');
  expect(result.errors[0]).not.toContain('first primitive');
  expect(result.retryReasonsDetailed[0]).toMatchObject({cause: asyncError});
  expect(result.errorsDetailed[0]).toMatchObject({cause: asyncError});
  expect(asyncError.message).toBe('hook location');
});

test('makeRunResult keeps the unserialized unhandled errors', () => {
  const error = new Error('unhandled');
  const result = makeRunResult(makeDescribe(ROOT_DESCRIBE_BLOCK_NAME), [error]);

  expect(result.unhandledErrorsDetailed[0]).toBe(error);
  expect(result.unhandledErrors[0]).toBe(error.stack);
});

test('a generator test body receives the shared test context', async () => {
  const rootDescribe = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
  const testContext = {fromHook: 'hook value'};
  let sawSharedContext = false;
  const circusTest = makeTest(
    function* (this: Circus.TestContext) {
      sawSharedContext = this === testContext;
    } as unknown as Circus.TestFn,
    undefined,
    false,
    'generator test',
    rootDescribe,
    undefined,
    new Error('async error'),
    false,
  );

  await callAsyncCircusFn(circusTest, testContext, {
    isHook: false,
    timeout: 1000,
  });

  expect(sawSharedContext).toBe(true);
});

test('a late done callback does not affect a later invocation', async () => {
  const rootDescribe = makeDescribe(ROOT_DESCRIBE_BLOCK_NAME);
  let firstDone: Circus.DoneFn = () => {};
  const circusTest = makeTest(
    done => {
      firstDone = done;
    },
    undefined,
    false,
    'done callback test',
    rootDescribe,
    undefined,
    new Error('async error'),
    false,
  );
  const options = {isHook: false, timeout: 1000};

  const firstInvocation = callAsyncCircusFn(circusTest, {}, options);
  firstDone(new Error('first failure'));
  await expect(firstInvocation).rejects.toThrow('first failure');

  circusTest.seenDone = false;
  let secondDone: Circus.DoneFn = () => {};
  circusTest.fn = done => {
    secondDone = done;
  };

  const secondInvocation = callAsyncCircusFn(circusTest, {}, options);
  firstDone();
  secondDone();

  await expect(secondInvocation).resolves.toBeUndefined();
});
