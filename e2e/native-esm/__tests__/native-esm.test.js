/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {readFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {double} from '../index';

test('should have correct import.meta', () => {
  expect(typeof require).toBe('undefined');
  expect(typeof jest).toBe('undefined');
  expect(import.meta).toEqual({
    url: expect.any(String),
  });
  expect(
    import.meta.url.endsWith('/e2e/native-esm/__tests__/native-esm.test.js')
  ).toBe(true);
});

test('should double stuff', () => {
  expect(double(1)).toBe(2);
});

test('should support importing node core modules', () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = resolve(dir, '../package.json');

  expect(JSON.parse(readFileSync(packageJsonPath, 'utf8'))).toEqual({
    jest: {
      testEnvironment: 'node',
      transform: {},
    },
    type: 'module',
  });
});

test('dynamic import should work', async () => {
  const {double: importedDouble} = await import('../index');

  expect(importedDouble).toBe(double);
  expect(importedDouble(1)).toBe(2);
});
