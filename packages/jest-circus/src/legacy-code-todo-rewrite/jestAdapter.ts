/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {JestEnvironment} from '@jest/environment';
import type {TestFileEvent, TestResult} from '@jest/test-result';
import type {Config} from '@jest/types';
import type Runtime from 'jest-runtime';
import type {SnapshotState} from 'jest-snapshot';
import {deepCyclicCopy} from 'jest-util';

const FRAMEWORK_INITIALIZER = require.resolve('./jestAdapterInit');

const jestAdapter = async (
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
  sendMessageToJest?: TestFileEvent,
): Promise<TestResult> => {
  const {initialize, runAndTransformResultsToJestFormat} =
    runtime.requireInternalModule<typeof import('./jestAdapterInit')>(
      FRAMEWORK_INITIALIZER,
    );

  const {globals, snapshotState} = await initialize({
    config,
    environment,
    globalConfig,
    localRequire: runtime.requireModule.bind(runtime),
    parentProcess: process,
    runtime,
    sendMessageToJest,
    setGlobalsForRuntime: runtime.setGlobalsForRuntime.bind(runtime),
    testPath,
  });

  if (config.fakeTimers.enableGlobally) {
    if (config.fakeTimers.legacyFakeTimers) {
      // during setup, this cannot be null (and it's fine to explode if it is)
      environment.fakeTimers!.useFakeTimers();
    } else {
      environment.fakeTimersModern!.useFakeTimers();
    }
  }

  globals.beforeEach(() => {
    if (config.resetModules) {
      runtime.resetModules();
    }

    if (config.clearMocks) {
      runtime.clearAllMocks();
    }

    if (config.resetMocks) {
      runtime.resetAllMocks();

      if (
        config.fakeTimers.enableGlobally &&
        config.fakeTimers.legacyFakeTimers
      ) {
        // during setup, this cannot be null (and it's fine to explode if it is)
        environment.fakeTimers!.useFakeTimers();
      }
    }

    if (config.restoreMocks) {
      runtime.restoreAllMocks();
    }
  });

  const setupAfterEnvStart = Date.now();
  for (const path of config.setupFilesAfterEnv) {
    const esm = runtime.unstable_shouldLoadAsEsm(path);

    if (esm) {
      await runtime.unstable_importModule(path);
    } else {
      const setupFile = runtime.requireModule(path);
      if (typeof setupFile === 'function') {
        await setupFile();
      }
    }
  }
  const setupAfterEnvEnd = Date.now();
  const esm = runtime.unstable_shouldLoadAsEsm(testPath);

  if (esm) {
    await runtime.unstable_importModule(testPath);
  } else {
    runtime.requireModule(testPath);
  }

  const setupAfterEnvPerfStats = {
    setupAfterEnvEnd,
    setupAfterEnvStart,
  };

  const results = await runAndTransformResultsToJestFormat({
    config,
    globalConfig,
    setupAfterEnvPerfStats,
    testPath,
  });

  _addSnapshotData(results, snapshotState);

  // We need to copy the results object to ensure we don't leaks the prototypes
  // from the VM. Jasmine creates the result objects in the parent process, we
  // should consider doing that for circus as well.
  return deepCyclicCopy(results, {keepPrototype: false});
};

const _addSnapshotData = (
  results: TestResult,
  snapshotState: SnapshotState,
) => {
  for (const {fullName, status, failing} of results.testResults) {
    if (
      status === 'pending' ||
      status === 'failed' ||
      (failing && status === 'passed')
    ) {
      // If test is skipped or failed, we don't want to mark
      // its snapshots as obsolete.
      // When tests called with test.failing pass, they've thrown an exception,
      // so maintain any snapshots after the error.
      snapshotState.markSnapshotsAsCheckedForTest(fullName);
    }
  }

  const uncheckedCount = snapshotState.getUncheckedCount();
  const uncheckedKeys = snapshotState.getUncheckedKeys();
  if (uncheckedCount) {
    snapshotState.removeUncheckedKeys();
  }

  const status = snapshotState.save();
  results.snapshot.fileDeleted = status.deleted;
  results.snapshot.added = snapshotState.added;
  results.snapshot.matched = snapshotState.matched;
  results.snapshot.unmatched = snapshotState.unmatched;
  results.snapshot.updated = snapshotState.updated;
  results.snapshot.unchecked = status.deleted ? 0 : uncheckedCount;
  // Copy the array to prevent memory leaks
  results.snapshot.uncheckedKeys = [...uncheckedKeys];
};

export default jestAdapter;
