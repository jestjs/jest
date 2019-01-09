/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import {json as runWithJson} from '../runJest';
import {skipSuiteOnJestCircus} from '../../scripts/ConditionalTest';

describe('async jasmine with pending during test', () => {
  skipSuiteOnJestCircus();

  it('should be reported as a pending test', () => {
    const result = runWithJson('jasmine-async', ['pending_in_promise.test.js']);
    const json = result.json;

    expect(json.numTotalTests).toBe(1);
    expect(json.numPassedTests).toBe(0);
    expect(json.numFailedTests).toBe(0);
    expect(json.numPendingTests).toBe(1);
  });
});
