/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

require('../src');

it('instruments by setting globalThis.__INSTRUMENTED__', () => {
  expect(globalThis.__INSTRUMENTED__).toBe(true);
});

it('preprocesses by setting globalThis.__PREPROCESSED__', () => {
  expect(globalThis.__PREPROCESSED__).toBe(true);
});
