/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('console debugging with --verbose', () => {
  const {stderr, stdout, exitCode} = runJest('console-debugging', [
    '--noStackTrace',
    '--no-cache',
  ]);
  const {summary, rest} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(stdout).toMatchSnapshot();
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
