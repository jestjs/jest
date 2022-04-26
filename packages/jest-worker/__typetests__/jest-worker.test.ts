/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectError, expectType} from 'tsd-lite';
import type {JestWorkerFarm} from 'jest-worker';
import type * as testWorker from './testWorker';

type TestWorker = {
  runTest: () => void;
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

expectType<Promise<void>>(detectedWorkerFarm.runTest());
expectType<Promise<void>>(detectedWorkerFarm.runTestAsync());

expectError(detectedWorkerFarm.getResult());
expectError(detectedWorkerFarm.isResult);

expectError(detectedWorkerFarm.setup());
expectError(detectedWorkerFarm.teardown());

expectError<Promise<void>>(detectedWorkerFarm.end());
expectType<Promise<{forceExited: boolean}>>(detectedWorkerFarm.end());

expectError<Promise<string>>(detectedWorkerFarm.getStderr());
expectType<NodeJS.ReadableStream>(detectedWorkerFarm.getStderr());

expectError<Promise<string>>(detectedWorkerFarm.getStdout());
expectType<NodeJS.ReadableStream>(detectedWorkerFarm.getStdout());

// typed JestWorkerFarm

declare const typedWorkerFarm: JestWorkerFarm<TestWorker>;

expectType<Promise<void>>(typedWorkerFarm.runTest());

expectError(typedWorkerFarm.isResult);
expectError(typedWorkerFarm.runTestAsync());

expectError(typedWorkerFarm.setup());
expectError(typedWorkerFarm.teardown());

expectError<Promise<void>>(typedWorkerFarm.end());
expectType<Promise<{forceExited: boolean}>>(typedWorkerFarm.end());

expectError<Promise<string>>(typedWorkerFarm.getStderr());
expectType<NodeJS.ReadableStream>(typedWorkerFarm.getStderr());

expectError<Promise<string>>(typedWorkerFarm.getStdout());
expectType<NodeJS.ReadableStream>(typedWorkerFarm.getStdout());
