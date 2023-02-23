/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import {skipSuiteOnJestCircus} from '@jest/test-utils';
import {extractSortedSummary} from '../Utils';
import runJest from '../runJest';

skipSuiteOnJestCircus();

const dir = path.resolve(__dirname, '../test-failing');

test('throws an error about unsupported modifier', () => {
  const result = runJest(dir);
  expect(result.exitCode).toBe(1);
  const {rest} = extractSortedSummary(result.stderr);
  expect(rest).toMatchSnapshot();
});
