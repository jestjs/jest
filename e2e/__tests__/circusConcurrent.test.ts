/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest, {json as runWithJson} from '../runJest';

skipSuiteOnJasmine();

it('runs the correct number of tests', () => {
  const {json} = runWithJson('circus-concurrent', ['concurrent.test.js']);

  expect(json.numTotalTests).toBe(10);
  expect(json.numPassedTests).toBe(6);
  expect(json.numFailedTests).toBe(2);
  expect(json.numPendingTests).toBe(2);
});

it('runs the tests in the correct order', () => {
  const {stdout} = runJest('circus-concurrent', ['concurrent.test.js']);
  expect(stdout).toMatchSnapshot();
});
