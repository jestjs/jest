/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

test('does not leave a storage enabled for each test file that already ran', () => {
  const {exitCode, stderr} = runJest('circus-test-execution-context', [
    '--runInBand',
  ]);

  expect(exitCode).toBe(0);
  const counts = [...stderr.matchAll(/live storages: (\d+)/g)].map(
    ([, count]) => count,
  );
  expect(counts).toHaveLength(3);
  expect(new Set(counts).size).toBe(1);
});
