/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import runJest from '../runJest';

test('use a custom resolver written as an ES module', () => {
  const result = runJest('custom-resolver-esm');
  expect(result.exitCode).toBe(0);
});

// The main process loads the resolver in `normalize`, but a worker only ever
// receives its path, so it has to load the resolver itself. `shouldRunInBand`
// gives way to `workerIdleMemoryLimit` before it looks at the test or worker
// count, which makes this the one flag that pins the run to workers.
test('use a custom resolver written as an ES module in workers', () => {
  const result = runJest('custom-resolver-esm', [
    '--max-workers=2',
    '--workerIdleMemoryLimit=1GB',
  ]);
  expect(result.exitCode).toBe(0);
});
