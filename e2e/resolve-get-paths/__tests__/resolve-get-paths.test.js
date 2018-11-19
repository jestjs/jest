/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

import {resolve} from 'path';

test('returns the resolve path for a relative path', () => {
  expect(require.resolve.paths('./mod.js')).toEqual([resolve(__dirname)]);
});

test('returns the resolve paths for a node_module', () => {
  expect(require.resolve.paths('mod').slice(0, 2)).toEqual([
    resolve(__dirname, 'node_modules'),
    resolve(__dirname, '..', 'node_modules'),
  ]);
});

test('returns null for a native node module', () => {
  expect(require.resolve.paths('fs')).toBeNull();
});
