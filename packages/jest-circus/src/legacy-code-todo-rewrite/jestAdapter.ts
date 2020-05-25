/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import type {Config} from '@jest/types';
import type {JestEnvironment} from '@jest/environment';
import type {TestResult} from '@jest/test-result';
import type {RuntimeType as Runtime} from 'jest-runtime';
import type {SnapshotStateType} from 'jest-snapshot';
import {deepCyclicCopy} from 'jest-util';

const FRAMEWORK_INITIALIZER = path.resolve(__dirname, './jestAdapterInit.js');
const EXPECT_INITIALIZER = path.resolve(__dirname, './jestExpect.js');

const jestAdapter = async (
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> => {
  const {
    initialize,
    runAndTransformResultsToJestFormat,
  } = runtime.requireInternalModule<typeof import('./jestAdapterInit')>(
    FRAMEWORK_INITIALIZER,
  );

  runtime
    .requireInternalModule<typeof import('./jestExpect')>(EXPECT_INITIALIZER)
    .default({expand: globalConfig.expand});

  const getPrettier = () =>
    config.prettierPath ? require(config.prettierPath) : null;
  const getBabelTraverse = () => require('@babel/traverse').default;

  const {globals, snapshotState} = await initialize({
    config,
    environment,
    getBabelTraverse,
    getPrettier,
    globalConfig,
    localRequire: runtime.requireModule.bind(runtime),
    parentProcess: process,
    testPath,
  });

  if (config.timers === 'fake' || config.timers === 'legacy') {
    // during setup, this cannot be null (and it's fine to explode if it is)
    environment.fakeTimers!.useFakeTimers();
  } else if (config.timers === 'modern') {
    environment.fakeTimersModern!.useFakeTimers();
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

      if (config.timers === 'fake') {
        // during setup, this cannot be null (and it's fine to explode if it is)
        environment.fakeTimers!.useFakeTimers();
      }
    }

    if (config.restoreMocks) {
      runtime.restoreAllMocks();
    }
  });

  for (const path of config.setupFilesAfterEnv) {
    // TODO: remove ? in Jest 26
    const esm = runtime.unstable_shouldLoadAsEsm?.(path);

    if (esm) {
      await runtime.unstable_importModule(path);
    } else {
      runtime.requireModule(path);
    }
  }

  // TODO: remove ? in Jest 26
  const esm = runtime.unstable_shouldLoadAsEsm?.(testPath);

  if (esm) {
    await runtime.unstable_importModule(testPath);
  } else {
    runtime.requireModule(testPath);
  }

  const results = await runAndTransformResultsToJestFormat({
    config,
    globalConfig,
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
  snapshotState: SnapshotStateType,
) => {
  results.testResults.forEach(({fullName, status}) => {
    if (status === 'pending' || status === 'failed') {
      // if test is skipped or failed, we don't want to mark
      // its snapshots as obsolete.
      snapshotState.markSnapshotsAsCheckedForTest(fullName);
    }
  });

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
  results.snapshot.unchecked = !status.deleted ? uncheckedCount : 0;
  // Copy the array to prevent memory leaks
  results.snapshot.uncheckedKeys = Array.from(uncheckedKeys);
};

export = jestAdapter;
