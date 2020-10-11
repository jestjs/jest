/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import wrap from 'jest-snapshot-serializer-raw';
import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';
import {extractSummary} from '../Utils';

skipSuiteOnJasmine();
test('`done()` should not be called more than once', () => {
  const {exitCode, stderr} = runJest('call-done-twice');
  const {rest} = extractSummary(stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(exitCode).toBe(1);
});
