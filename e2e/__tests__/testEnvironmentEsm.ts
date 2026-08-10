/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';
import runJest from '../runJest';

it('support test environment written in ESM', () => {
  const DIR = resolve(__dirname, '../test-environment-esm');
  const {exitCode} = runJest(DIR);

  expect(exitCode).toBe(0);
});
