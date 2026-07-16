/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import {extractSummary} from '../Utils';
import runJest from '../runJest';

skipSuiteOnJasmine();
test('`done()` should not be called more than once', () => {
  const {exitCode, stderr} = runJest('call-done-twice');
  const {rest} = extractSummary(stderr);
  expect(rest).toMatchSnapshot();
  expect(exitCode).toBe(1);
});
