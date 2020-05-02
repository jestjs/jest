/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import wrap from 'jest-snapshot-serializer-raw';
import runJest from '../runJest';
import {extractSummary} from '../Utils';

skipSuiteOnJasmine();

test('errors when a test both returns a promise and takes a callback', () => {
  const result = runJest('promise-and-callback');

  const {rest} = extractSummary(result.stderr);
  expect(wrap(rest)).toMatchSnapshot();
  expect(result.exitCode).toBe(1);
});
