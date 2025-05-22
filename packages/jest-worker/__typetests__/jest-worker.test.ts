/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from 'tstyche';
import type {JestWorkerFarm} from 'jest-worker';
import type * as testWorker from './testWorker';

type TestWorker = {
  runTest: (a: string, b: number) => void;
  doSomething: () => void;
  isResult: boolean;

  // the reserved keys should not be included in the resulting type
  end: () => void;
  getStderr: () => string;
  getStdout: () => string;
  setup: () => void;
  teardown: () => void;
};

declare const unknownWorkerFarm: JestWorkerFarm<Record<string, unknown>>;

test('unknown JestWorkerFarm', () => {
  expect(unknownWorkerFarm).type.not.toHaveProperty('runTest');
  expect(unknownWorkerFarm).type.not.toHaveProperty('runTestAsync');

  expect(unknownWorkerFarm).type.not.toHaveProperty('getResult');
  expect(unknownWorkerFarm).type.not.toHaveProperty('isResult');

  expect(unknownWorkerFarm).type.not.toHaveProperty('setup');
  expect(unknownWorkerFarm).type.not.toHaveProperty('teardown');

  expect(unknownWorkerFarm.start()).type.toBe<Promise<void>>();
  expect(unknownWorkerFarm.end()).type.toBe<Promise<{forceExited: boolean}>>();

  expect(unknownWorkerFarm.getStderr()).type.toBe<NodeJS.ReadableStream>();
  expect(unknownWorkerFarm.getStdout()).type.toBe<NodeJS.ReadableStream>();
});

declare const inferredWorkerFarm: JestWorkerFarm<typeof testWorker>;

test('inferred JestWorkerFarm', () => {
  expect(inferredWorkerFarm.runTest('abc', true)).type.toBe<Promise<void>>();
  expect(inferredWorkerFarm.runTestAsync(123, 456)).type.toBe<Promise<void>>();

  expect(inferredWorkerFarm.doSomething()).type.toBe<Promise<void>>();
  expect(inferredWorkerFarm.doSomething()).type.toBe<Promise<void>>();
  expect(inferredWorkerFarm.doSomethingAsync()).type.toBe<Promise<void>>();
  expect(inferredWorkerFarm.doSomethingAsync()).type.toBe<Promise<void>>();

  expect(inferredWorkerFarm.runTest).type.not.toBeCallableWith();
  expect(inferredWorkerFarm.runTest).type.not.toBeCallableWith('abc');
  expect(inferredWorkerFarm.runTestAsync).type.not.toBeCallableWith();
  expect(inferredWorkerFarm.runTestAsync).type.not.toBeCallableWith(123);
  expect(inferredWorkerFarm.doSomething).type.not.toBeCallableWith(123);
  expect(inferredWorkerFarm.doSomethingAsync).type.not.toBeCallableWith('abc');

  expect(inferredWorkerFarm).type.not.toHaveProperty('getResult');
  expect(inferredWorkerFarm).type.not.toHaveProperty('isResult');

  expect(inferredWorkerFarm).type.not.toHaveProperty('setup');
  expect(inferredWorkerFarm).type.not.toHaveProperty('teardown');

  expect(inferredWorkerFarm.start()).type.toBe<Promise<void>>();
  expect(inferredWorkerFarm.end()).type.toBe<Promise<{forceExited: boolean}>>();

  expect(inferredWorkerFarm.getStderr()).type.toBe<NodeJS.ReadableStream>();
  expect(inferredWorkerFarm.getStdout()).type.toBe<NodeJS.ReadableStream>();
});

declare const typedWorkerFarm: JestWorkerFarm<TestWorker>;

test('typed JestWorkerFarm', () => {
  expect(typedWorkerFarm.runTest('abc', 123)).type.toBe<Promise<void>>();
  expect(typedWorkerFarm.doSomething()).type.toBe<Promise<void>>();

  expect(typedWorkerFarm.runTest).type.not.toBeCallableWith();
  expect(typedWorkerFarm.runTest).type.not.toBeCallableWith('abc');
  expect(typedWorkerFarm.doSomething).type.not.toBeCallableWith('abc');

  expect(typedWorkerFarm).type.not.toHaveProperty('isResult');
  expect(typedWorkerFarm).type.not.toHaveProperty('runTestAsync');

  expect(typedWorkerFarm).type.not.toHaveProperty('setup');
  expect(typedWorkerFarm).type.not.toHaveProperty('teardown');

  expect(typedWorkerFarm.start()).type.toBe<Promise<void>>();
  expect(typedWorkerFarm.end()).type.toBe<Promise<{forceExited: boolean}>>();

  expect(typedWorkerFarm.getStderr()).type.toBe<NodeJS.ReadableStream>();
  expect(typedWorkerFarm.getStdout()).type.toBe<NodeJS.ReadableStream>();
});
