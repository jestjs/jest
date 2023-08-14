/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary, extractWorkerPids} from '../Utils';
import runJest from '../runJest';

it('all 3 test files should complete', () => {
  const result = runJest('worker-restarting');
  expect(result.exitCode).toBe(0);
  const {summary} = extractSummary(result.stderr);
  expect(summary).toMatchSnapshot();
});

it('3 different worker processes should get used', () => {
  const result = runJest('worker-restarting', ['--logHeapUsage']);
  const processIds = extractWorkerPids(result.stderr);
  expect([...processIds]).toHaveLength(3);
});

it('2 worker processes should be kept with high limit', () => {
  // This could get flaky if memory usage on tiny test becomes much worse,
  // but that'd be good to notice ;-).  As of this writing, I've seen 20-43 MB.
  const result = runJest('worker-not-restarting', ['--logHeapUsage']);
  const processIds = extractWorkerPids(result.stderr);
  expect([...processIds]).toHaveLength(2);
});
