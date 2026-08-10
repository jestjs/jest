/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('console printing', () => {
  const {stderr, exitCode} = runJest('console-after-teardown');
  const {rest} = extractSummary(stderr);

  expect(exitCode).toBe(1);

  const withoutTrace = rest.split('\n').slice(0, -3).join('\n');

  expect(withoutTrace).toMatchSnapshot();
});
