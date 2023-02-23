/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {makeGlobalConfig} from '@jest/test-utils';
import getResultHeader from '../getResultHeader';

const endTime = 1577717671160;
const testTime = 5500;

const testResult = {
  testFilePath: '/foo',
};
const testResultSlow = {
  perfStats: {
    end: endTime,
    runtime: testTime,
    slow: true,
    start: endTime - testTime,
  },
  testFilePath: '/foo',
};
const testResultFast = {
  perfStats: {
    end: endTime,
    runtime: testTime,
    slow: false,
    start: endTime - testTime,
  },
  testFilePath: '/foo',
};

const globalConfig = makeGlobalConfig();

test('should display test time for slow test', () => {
  const result = getResultHeader(testResultSlow, globalConfig);

  expect(result).toContain(`${testTime / 1000} s`);
});

test('should not display test time for fast test ', () => {
  const result = getResultHeader(testResultFast, globalConfig);

  expect(result).not.toContain(`${testTime / 1000} s`);
});
