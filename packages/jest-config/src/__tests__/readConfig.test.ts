/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {readConfig} from '../';

test('readConfig() throws when an object is passed without a file path', async () => {
  await expect(
    readConfig(
      {$0: '', _: []},
      {} /* packageRootOrConfig */,
      false /* skipArgvConfigOption */,
      null /* parentConfigPath */,
    ),
  ).rejects.toThrow(
    'Jest: Cannot use configuration as an object without a file path',
  );
});
