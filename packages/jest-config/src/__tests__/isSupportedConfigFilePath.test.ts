/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as path from 'node:path';
import {JEST_CONFIG_EXT_ORDER} from '../constants';
import {isSupportedConfigFilePath} from '../utils';

test.each([
  ...JEST_CONFIG_EXT_ORDER.map(ext => `jest.config${ext.toUpperCase()}`),
  '.JESTRC',
  '.CoNfIg/JesTrc',
  '.CoNfIg\\.\\JesTrc',
])('accepts supported config path %s regardless of case', configPath => {
  expect(isSupportedConfigFilePath(configPath)).toBe(true);
});

test('accepts a relative rc path from a mixed-case .config directory', () => {
  const cwd = jest
    .spyOn(process, 'cwd')
    .mockReturnValue(path.resolve('.CoNfIg'));

  try {
    expect(isSupportedConfigFilePath('./jestrc')).toBe(true);
  } finally {
    cwd.mockRestore();
  }
});

test.each(['jest.config.JS.bak', '.JESTRC-backup', '.CoNfIg/JesTrc-backup'])(
  'rejects unsupported config path %s',
  configPath => {
    expect(isSupportedConfigFilePath(configPath)).toBe(false);
  },
);
