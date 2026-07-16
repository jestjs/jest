/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {skipSuiteOnJasmine} from '@jest/test-utils';
import runJest from '../runJest';

skipSuiteOnJasmine();

test('Snapshots get correct names in concurrent tests', () => {
  const result = runJest('snapshot-concurrent', ['--ci']);
  expect(result.exitCode).toBe(0);
});
