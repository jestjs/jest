/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJestCircus} from '@jest/test-utils';
import {json as runWithJson} from '../runJest';

describe('async jasmine with pending during test', () => {
  skipSuiteOnJestCircus();

  it('should be reported as a pending test', () => {
    const {json} = runWithJson('jasmine-async', ['pendingInPromise.test.js']);

    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(0);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(1);
  });
});
