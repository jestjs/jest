/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'path';
import runJest from '../runJest';

test('`require.main` not undefined after createRequire', () => {
  const {stdout} = runJest('require-main-after-create-require');

  expect(stdout).toBe(
    path.join(
      __dirname,
      '../require-main-after-create-require/__tests__/parent.test.js',
    ),
  );
});
