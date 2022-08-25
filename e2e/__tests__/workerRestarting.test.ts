/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

it('all 3 test files should complete', () => {
  const result = runJest('worker-restarting');
  expect(result.exitCode).toBe(0);
  const {summary} = extractSummary(result.stderr);
  expect(summary).toMatchSnapshot();
});

it.each(['runInBand', 'detectOpenHandles'])(
  'should warn when used with %s',
  arg => {
    const result = runJest('worker-restarting', [`--${arg}`]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toMatch(
      `workerIdleMemoryLimit does not work in combination with ${arg}`,
    );
  },
);
