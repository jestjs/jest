/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectError, expectType} from 'tsd-lite';
import {JestWorkerFarm, createWorkerFarm} from 'jest-worker';
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

// createWorker()

expectAssignable<Promise<JestWorkerFarm<typeof testWorker>>>(
  createWorkerFarm<typeof testWorker>('/testWorker'),
);

// unknown worker

(async () => {
  const unknownWorker = await createWorkerFarm('/testWorker');

  expectError(unknownWorker.runTest());
  expectError(unknownWorker.runTestAsync());

  expectError(unknownWorker.getResult());
  expectError(unknownWorker.isResult);

  expectError(unknownWorker.setup());
  expectError(unknownWorker.teardown());

  expectType<Promise<{forceExited: boolean}>>(unknownWorker.end());
  expectType<NodeJS.ReadableStream>(unknownWorker.getStderr());
  expectType<NodeJS.ReadableStream>(unknownWorker.getStdout());
})();

// detected worker

(async () => {
  const detectedWorker = await createWorkerFarm<typeof testWorker>(
    './testWorker',
  );

  expectType<Promise<void>>(detectedWorker.runTest());
  expectType<Promise<void>>(detectedWorker.runTestAsync());

  expectError(detectedWorker.getResult());
  expectError(detectedWorker.isResult);

  expectError(detectedWorker.setup());
  expectError(detectedWorker.teardown());

  expectError<Promise<void>>(detectedWorker.end());
  expectType<Promise<{forceExited: boolean}>>(detectedWorker.end());

  expectError<Promise<string>>(detectedWorker.getStderr());
  expectType<NodeJS.ReadableStream>(detectedWorker.getStderr());

  expectError<Promise<string>>(detectedWorker.getStdout());
  expectType<NodeJS.ReadableStream>(detectedWorker.getStdout());
})();

// typed worker

(async () => {
  const typedWorker = await createWorkerFarm<TestWorker>('/testWorker', {
    exposedMethods: ['runTest'],
  });

  expectType<Promise<void>>(typedWorker.runTest());

  expectError(typedWorker.isResult);
  expectError(typedWorker.runTestAsync());

  expectError(typedWorker.setup());
  expectError(typedWorker.teardown());

  expectError<Promise<void>>(typedWorker.end());
  expectType<Promise<{forceExited: boolean}>>(typedWorker.end());

  expectError<Promise<string>>(typedWorker.getStderr());
  expectType<NodeJS.ReadableStream>(typedWorker.getStderr());

  expectError<Promise<string>>(typedWorker.getStdout());
  expectType<NodeJS.ReadableStream>(typedWorker.getStdout());
})();
