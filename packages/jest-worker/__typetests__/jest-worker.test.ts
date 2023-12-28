/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectNotAssignable, expectType} from 'tsd-lite';
import type {JestWorkerFarm} from 'jest-worker';
import type * as testWorker from './testWorker';

type TestWorker = {
  runTest: (a: string, b: number) => void;
  doSomething: () => void;
  isResult: boolean;
  end: () => void; // reserved keys should be excluded from returned type
  getStderr: () => string;
  getStdout: () => string;
  setup: () => void;
  teardown: () => void;
};

// unknown JestWorkerFarm

declare const unknownWorkerFarm: JestWorkerFarm<Record<string, unknown>>;

expectError(unknownWorkerFarm.runTest());
expectError(unknownWorkerFarm.runTestAsync());

expectError(unknownWorkerFarm.getResult());
expectError(unknownWorkerFarm.isResult);

expectError(unknownWorkerFarm.setup());
expectError(unknownWorkerFarm.teardown());

expectType<Promise<{forceExited: boolean}>>(unknownWorkerFarm.end());
expectType<NodeJS.ReadableStream>(unknownWorkerFarm.getStderr());
expectType<NodeJS.ReadableStream>(unknownWorkerFarm.getStdout());

// detected JestWorkerFarm

declare const detectedWorkerFarm: JestWorkerFarm<typeof testWorker>;

expectType<Promise<void>>(detectedWorkerFarm.runTest('abc', true));
expectType<Promise<void>>(detectedWorkerFarm.runTestAsync(123, 456));

expectType<Promise<void>>(detectedWorkerFarm.doSomething());
expectType<Promise<void>>(detectedWorkerFarm.doSomething());
expectType<Promise<void>>(detectedWorkerFarm.doSomethingAsync());
expectType<Promise<void>>(detectedWorkerFarm.doSomethingAsync());

expectError(detectedWorkerFarm.runTest());
expectError(detectedWorkerFarm.runTest('abc'));
expectError(detectedWorkerFarm.runTestAsync());
expectError(detectedWorkerFarm.runTestAsync(123));
expectError(detectedWorkerFarm.doSomething(123));
expectError(detectedWorkerFarm.doSomethingAsync('abc'));

expectError(detectedWorkerFarm.getResult());
expectError(detectedWorkerFarm.isResult);

expectError(detectedWorkerFarm.setup());
expectError(detectedWorkerFarm.teardown());

expectNotAssignable<Promise<void>>(detectedWorkerFarm.end());
expectType<Promise<{forceExited: boolean}>>(detectedWorkerFarm.end());

expectNotAssignable<Promise<string>>(detectedWorkerFarm.getStderr());
expectType<NodeJS.ReadableStream>(detectedWorkerFarm.getStderr());

expectNotAssignable<Promise<string>>(detectedWorkerFarm.getStdout());
expectType<NodeJS.ReadableStream>(detectedWorkerFarm.getStdout());

// typed JestWorkerFarm

declare const typedWorkerFarm: JestWorkerFarm<TestWorker>;

expectType<Promise<void>>(typedWorkerFarm.runTest('abc', 123));
expectType<Promise<void>>(typedWorkerFarm.doSomething());

expectError(typedWorkerFarm.runTest());
expectError(typedWorkerFarm.runTest('abc'));
expectError(typedWorkerFarm.doSomething('abc'));

expectError(typedWorkerFarm.isResult);
expectError(typedWorkerFarm.runTestAsync());

expectError(typedWorkerFarm.setup());
expectError(typedWorkerFarm.teardown());

expectType<Promise<void>>(typedWorkerFarm.start());

expectNotAssignable<Promise<void>>(typedWorkerFarm.end());
expectType<Promise<{forceExited: boolean}>>(typedWorkerFarm.end());

expectNotAssignable<Promise<string>>(typedWorkerFarm.getStderr());
expectType<NodeJS.ReadableStream>(typedWorkerFarm.getStderr());

expectNotAssignable<Promise<string>>(typedWorkerFarm.getStdout());
expectType<NodeJS.ReadableStream>(typedWorkerFarm.getStdout());
