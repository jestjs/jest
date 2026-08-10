/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('runs test with native ESM', () => {
  const {exitCode, stderr, stdout} = runJest('resolve-async', [], {
    nodeOptions: '--experimental-vm-modules --no-warnings',
  });

  const {summary} = extractSummary(stderr);

  expect(summary).toMatchSnapshot();
  expect(stdout).toBe('');
  expect(exitCode).toBe(0);
});
