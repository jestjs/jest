/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import {json as runWithJson} from '../runJest';

test('testNamePattern skipped', () => {
  const {stderr, exitCode} = runWithJson('test-name-pattern-skipped', [
    '--testNamePattern',
    'false',
  ]);
  const {summary} = extractSummary(stderr);

  expect(exitCode).toBe(0);
  expect(summary).toMatchSnapshot();
});
