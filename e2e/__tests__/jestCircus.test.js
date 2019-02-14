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

test('run only "it.only" tests', () => {
  const jestCircusPath = require.resolve('../../packages/jest-circus/runner');
  const {stderr} = runJest('jest-circus', [`--testRunner=${jestCircusPath}`]);
  expect(countExecutedTests(stderr)).toBe(1);
});
