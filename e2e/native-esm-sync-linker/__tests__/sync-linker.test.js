/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fromA, valueB, valueC} from '../a.mjs';
import {peekA} from '../c.mjs';

test('diamond + cycle graph evaluates correctly', () => {
  expect(fromA).toEqual({valueA: 'a', valueB: 'b', valueC: 'c'});
  expect(valueB).toBe('b');
  expect(valueC).toBe('c');
  expect(peekA()).toBe('a');
});
