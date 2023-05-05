/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {readConfigs} from '../';

jest.mock('graceful-fs', () => ({
  ...jest.requireActual<typeof import('fs')>('fs'),
  existsSync: jest.fn(() => true),
  lstatSync: jest.fn(() => ({
    isDirectory: () => false,
  })),
}));

test('readConfigs() throws when called without project paths', async () => {
  await expect(
    // @ts-expect-error
    readConfigs(null /* argv */, [] /* projectPaths */),
  ).rejects.toThrow('jest: No configuration found for any project.');
});
