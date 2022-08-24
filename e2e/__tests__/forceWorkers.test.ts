/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

it('all 3 test files should complete', () => {
  const result = runJest('force-workers', ['--forceWorkers']);

  expect(result.exitCode).toBe(0);
  const {summary} = extractSummary(result.stderr);
  expect(summary).toMatchSnapshot();
});

it.each(['--runInBand', '--detectOpenHandles'])(
  'should throw with incompatible %s arg',
  arg => {
    const result = runJest('force-workers', ['--forceWorkers', arg]);

    expect(result.exitCode).toBe(1);
  },
);
