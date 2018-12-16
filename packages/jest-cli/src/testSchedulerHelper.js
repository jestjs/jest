/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const SLOW_TEST_TIME = 1000;

export function computeRunInBand(tests, isWatchMode, maxWorkers, timings) {
  // Run in band if we only have one test or one worker available, unless we
  // are using the watch mode, in which case the TTY has to be responsive and
  // we cannot schedule anything in the main thread. Same logic applies to
  // watchAll.
  //
  // If we are confident from previous runs that the tests will finish
  // quickly we also run in band to reduce the overhead of spawning workers.
  const areFastTests = timings.every(timing => timing < SLOW_TEST_TIME);

  const oneWorkerOrLess = maxWorkers <= 1;
  const oneTestOrLess = tests.length <= 1;

  if (isWatchMode) {
    return oneWorkerOrLess || (oneTestOrLess && areFastTests);
  }

  return (
    oneWorkerOrLess ||
    oneTestOrLess ||
    (tests.length <= 20 && timings.length > 0 && areFastTests)
  );
}
