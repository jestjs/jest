/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('should work without error', () => {
  const output = runJest('dom-diffing');
  expect(output.failed).toBe(true);
  const {rest, summary} = extractSummary(output.stderr);
  expect(rest).toMatchSnapshot();
  expect(summary).toMatchSnapshot();
});
