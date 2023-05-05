/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();
test('`done()` works properly in hooks', () => {
  const {exitCode} = runJest('done-in-hooks');
  expect(exitCode).toBe(0);
});
