/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {resolve} from 'path';

test('finds a module relative to one of the given paths', () => {
  expect(require.resolve('./mod.js', {paths: ['../dir']})).toBe(
    resolve(__dirname, '..', 'dir', 'mod.js'),
  );
});

test('finds a module without a leading "./" relative to one of the given paths', () => {
  expect(require.resolve('mod.js', {paths: ['../dir']})).toBe(
    resolve(__dirname, '..', 'dir', 'mod.js'),
  );
});

test('finds a node_module above one of the given paths', () => {
  expect(require.resolve('mod', {paths: ['../dir']})).toBe(
    resolve(__dirname, '..', 'node_modules', 'mod', 'index.js'),
  );
});

test('finds a native node module when paths are given', () => {
  expect(require.resolve('fs', {paths: ['../dir']})).toBe('fs');
});

test('throws an error if the module cannot be found from given paths', () => {
  expect(() => require.resolve('./mod.js', {paths: ['..']})).toThrow(
    "Cannot resolve module './mod.js' from paths ['..'] from ",
  );
});

test('throws module not found error if the module cannot be found from given paths', () => {
  expect(() => require.resolve('./mod.js', {paths: ['..']})).toThrow(
    expect.objectContaining({code: 'MODULE_NOT_FOUND'}),
  );
});
