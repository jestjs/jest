/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('handles test names with different line endings in snapshots', () => {
  const result = runJest('snapshot-crlf');
  const {summary} = extractSummary(result.stderr);

  expect(result.exitCode).toBe(0);
  expect(summary).toMatchSnapshot();
});
