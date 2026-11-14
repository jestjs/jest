/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {extractSummary} from '../Utils';
import runJest from '../runJest';

test('shows the message of a custom asymmetric matcher in the diff', () => {
  const {exitCode, stderr} = runJest('custom-asymmetric-matcher-message');

  expect(exitCode).toBe(1);
  expect(extractSummary(stderr).rest).toMatchSnapshot();
});
