/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {json as runWithJson} from '../runJest';

it('works with concurrent.each', () => {
  const {json} = runWithJson('circus-concurrent', [
    'concurrent-each.test.js',
    '--testRunner=jest-circus/runner',
  ]);
  expect(json.numTotalTests).toBe(4);
  expect(json.numPassedTests).toBe(2);
  expect(json.numFailedTests).toBe(0);
  expect(json.numPendingTests).toBe(2);
});

it('works with concurrent.only.each', () => {
  const {json} = runWithJson('circus-concurrent', [
    'concurrent-only-each.test.js',
    '--testRunner=jest-circus/runner',
  ]);
  expect(json.numTotalTests).toBe(4);
  expect(json.numPassedTests).toBe(2);
  expect(json.numFailedTests).toBe(0);
  expect(json.numPendingTests).toBe(2);
});
