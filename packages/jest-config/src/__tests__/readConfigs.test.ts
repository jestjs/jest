/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {readConfigs} from '../index';

test('readConfigs() throws when called without project paths', async () => {
  // @ts-ignore
  const asyncConfig = readConfigs(null /* argv */, [] /* projectPaths */);
  await expect(asyncConfig).rejects.toThrowError(
    'jest: No configuration found for any project.',
  );
});
