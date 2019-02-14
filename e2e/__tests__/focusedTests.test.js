/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import runJest from '../runJest';
import {countExecutedTests} from '../Utils';

it('runs only "it.only" tests', () => {
  const {stderr} = runJest('jest-circus');
  expect(countExecutedTests(stderr)).toBe(1);
});
