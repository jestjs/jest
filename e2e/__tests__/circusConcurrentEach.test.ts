/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {skipSuiteOnJasmine} from '@jest/test-utils';
import {json as runWithJson} from '../runJest';

skipSuiteOnJasmine();

it('works with concurrent.each', () => {
  const {json} = runWithJson('circus-concurrent', ['concurrent-each.test.js']);
  expect(json.numTotalTests).toBe(4);
  expect(json.numPassedTests).toBe(2);
  expect(json.numFailedTests).toBe(0);
  expect(json.numPendingTests).toBe(2);
});

it('works with concurrent.only.each', () => {
  const {json} = runWithJson('circus-concurrent', [
    'concurrent-only-each.test.js',
  ]);
  expect(json.numTotalTests).toBe(4);
  expect(json.numPassedTests).toBe(2);
  expect(json.numFailedTests).toBe(0);
  expect(json.numPendingTests).toBe(2);
});
