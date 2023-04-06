/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Test} from '@jest/test-result';
import type {Config} from '@jest/types';

const SLOW_TEST_TIME = 1000;

export function shouldRunInBand(
  tests: Array<Test>,
  timings: Array<number>,
  {
    detectOpenHandles,
    maxWorkers,
    watch,
    watchAll,
    workerIdleMemoryLimit,
  }: Config.GlobalConfig,
): boolean {
  // detectOpenHandles makes no sense without runInBand, because it cannot detect leaks in workers
  if (detectOpenHandles) {
    return true;
  }

  /*
   * If we are using watch/watchAll mode, don't schedule anything in the main
   * thread to keep the TTY responsive and to keep the watcher running even if
   * the test crashes.
   */
  const isWatchMode = watch || watchAll;
  if (isWatchMode) {
    return false;
  }

  /*
   * Otherwise, run in band if we only have one test or one worker available.
   * Also, if we are confident from previous runs that the tests will finish
   * quickly we also run in band to reduce the overhead of spawning workers.
   * https://github.com/facebook/jest/blob/700e0dadb85f5dc8ff5dac6c7e98956690049734/packages/jest-config/src/getMaxWorkers.js#L14-L17
   */
  const areFastTests = timings.every(timing => timing < SLOW_TEST_TIME);
  const oneWorkerOrLess = maxWorkers <= 1;
  const oneTestOrLess = tests.length <= 1;

  return (
    // When specifying a memory limit, workers should be used
    !workerIdleMemoryLimit &&
    (oneWorkerOrLess ||
      oneTestOrLess ||
      (tests.length <= 20 && timings.length > 0 && areFastTests))
  );
}
