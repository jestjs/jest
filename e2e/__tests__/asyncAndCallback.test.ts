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

test('errors when a test both returns a promise and takes a callback', () => {
  const result = runJest('promise-and-callback');

  const {rest} = extractSummary(result.stderr);
  expect(rest).toMatchSnapshot();
  expect(result.exitCode).toBe(1);
});
