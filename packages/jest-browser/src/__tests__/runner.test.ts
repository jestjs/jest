/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test, TestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import BrowserTestRunner from '../runner';

const mockRunBrowserTest = jest.fn<
  Promise<TestResult>,
  [Test, Config.GlobalConfig]
>();

jest.mock('../runBrowserTest', () => ({
  runBrowserTest: (...args: [Test, Config.GlobalConfig]) =>
    mockRunBrowserTest(...args),
}));

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(_resolve => {
    resolve = _resolve;
  });
  return {promise, resolve};
}

function makeTest(
  testPath: string,
  browserMode: {fileParallelism?: boolean; headless?: boolean} = {},
): Test {
  return {
    context: {
      config: {
        browserMode: {
          enabled: true,
          ...browserMode,
        },
        rootDir: '/repo',
      },
    },
    path: testPath,
  } as unknown as Test;
}

function createCallbacks() {
  return {
    onFailure: jest.fn(async () => undefined),
    onResult: jest.fn(async () => undefined),
    onStart: jest.fn(async () => undefined),
  };
}

async function waitForMockCalls(
  mockFn: jest.Mock,
  expectedCalls: number,
): Promise<void> {
  for (let i = 0; i < 30; i += 1) {
    if (mockFn.mock.calls.length >= expectedCalls) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

describe('BrowserTestRunner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('runs tests in parallel when fileParallelism not false and headless', async () => {
    const deferreds: Array<Deferred<TestResult>> = [];
    mockRunBrowserTest.mockImplementation(() => {
      const deferred = createDeferred({});
      deferreds.push(deferred);
      return deferred.promise;
    });

    const runner = new BrowserTestRunner({
      maxWorkers: 2,
    } as Config.GlobalConfig);
    const tests = [
      makeTest('/repo/a.test.ts', {headless: true}),
      makeTest('/repo/b.test.ts', {headless: true}),
      makeTest('/repo/c.test.ts', {headless: true}),
    ];
    const {onFailure, onResult, onStart} = createCallbacks();

    const runPromise = runner.runTests(
      tests,
      {} as never,
      onStart,
      onResult,
      onFailure,
      {serial: false},
    );

    await Promise.resolve();

    expect(mockRunBrowserTest).toHaveBeenCalledTimes(2);
    expect(onStart).toHaveBeenCalledTimes(2);

    deferreds[0]?.resolve({} as TestResult);
    await waitForMockCalls(mockRunBrowserTest as unknown as jest.Mock, 3);
    expect(mockRunBrowserTest).toHaveBeenCalledTimes(3);

    deferreds[1]?.resolve({} as TestResult);
    deferreds[2]?.resolve({} as TestResult);
    await runPromise;

    expect(onResult).toHaveBeenCalledTimes(3);
    expect(onFailure).not.toHaveBeenCalled();
  });

  test('runs tests serially when fileParallelism is false', async () => {
    const deferreds: Array<Deferred<TestResult>> = [];
    mockRunBrowserTest.mockImplementation(() => {
      const deferred = createDeferred({});
      deferreds.push(deferred);
      return deferred.promise;
    });

    const runner = new BrowserTestRunner({
      maxWorkers: 4,
    } as Config.GlobalConfig);
    const tests = [
      makeTest('/repo/a.test.ts', {fileParallelism: false, headless: true}),
      makeTest('/repo/b.test.ts', {fileParallelism: false, headless: true}),
      makeTest('/repo/c.test.ts', {fileParallelism: false, headless: true}),
    ];
    const {onFailure, onResult, onStart} = createCallbacks();

    const runPromise = runner.runTests(
      tests,
      {} as never,
      onStart,
      onResult,
      onFailure,
      {serial: false},
    );

    await Promise.resolve();
    expect(mockRunBrowserTest).toHaveBeenCalledTimes(1);

    deferreds[0]?.resolve({} as TestResult);
    await waitForMockCalls(mockRunBrowserTest as unknown as jest.Mock, 2);
    expect(mockRunBrowserTest).toHaveBeenCalledTimes(2);

    deferreds[1]?.resolve({} as TestResult);
    await waitForMockCalls(mockRunBrowserTest as unknown as jest.Mock, 3);
    expect(mockRunBrowserTest).toHaveBeenCalledTimes(3);

    deferreds[2]?.resolve({} as TestResult);
    await runPromise;

    expect(onStart).toHaveBeenCalledTimes(3);
    expect(onResult).toHaveBeenCalledTimes(3);
  });

  test('runs tests serially when headless is false', async () => {
    const deferreds: Array<Deferred<TestResult>> = [];
    mockRunBrowserTest.mockImplementation(() => {
      const deferred = createDeferred({});
      deferreds.push(deferred);
      return deferred.promise;
    });

    const runner = new BrowserTestRunner({
      maxWorkers: 4,
    } as Config.GlobalConfig);
    const tests = [
      makeTest('/repo/a.test.ts', {headless: false}),
      makeTest('/repo/b.test.ts', {headless: false}),
    ];
    const {onFailure, onResult, onStart} = createCallbacks();

    const runPromise = runner.runTests(
      tests,
      {} as never,
      onStart,
      onResult,
      onFailure,
      {serial: false},
    );

    await Promise.resolve();
    expect(mockRunBrowserTest).toHaveBeenCalledTimes(1);

    deferreds[0]?.resolve({} as TestResult);
    await waitForMockCalls(mockRunBrowserTest as unknown as jest.Mock, 2);
    expect(mockRunBrowserTest).toHaveBeenCalledTimes(2);

    deferreds[1]?.resolve({} as TestResult);
    await runPromise;

    expect(onStart).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledTimes(2);
  });

  test('runs tests serially when only 1 test', async () => {
    const deferred = createDeferred({});
    mockRunBrowserTest.mockReturnValue(deferred.promise);

    const runner = new BrowserTestRunner({
      maxWorkers: 4,
    } as Config.GlobalConfig);
    const tests = [makeTest('/repo/a.test.ts', {headless: true})];
    const {onFailure, onResult, onStart} = createCallbacks();

    const runPromise = runner.runTests(
      tests,
      {} as never,
      onStart,
      onResult,
      onFailure,
      {serial: false},
    );

    await Promise.resolve();
    expect(mockRunBrowserTest).toHaveBeenCalledTimes(1);

    deferred.resolve({});
    await runPromise;

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onFailure).not.toHaveBeenCalled();
  });
});
