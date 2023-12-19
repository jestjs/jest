/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

console.log(globalThis.window ? 'WINDOW' : 'NO WINDOW');

test('stub', () => expect(1).toBe(1));

test('structuredClone works in env', () => {
  expect(typeof structuredClone).toBe('function');
  const x = {a: 'b'};
  expect(structuredClone(x)).not.toBe(x);
});
