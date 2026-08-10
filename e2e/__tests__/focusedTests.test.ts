/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {json} from '../runJest';

it('runs only "it.only" tests', () => {
  const {
    json: {numPassedTests, numPendingTests},
  } = json('focused-tests');
  expect(numPassedTests).toBe(1);
  expect(numPendingTests).toBe(2);
});
