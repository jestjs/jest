/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

it('all 3 test files should complete', () => {
  const result = runJest('worker-restart-before-send');
  const {summary} = extractSummary(result.stderr);
  expect(summary).toMatchSnapshot();
});
