/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import m, {exportedSymbol} from '../module-under-test';
import symbol from '../some-symbol';

test('ESM transformer intercepts', () => {
  expect(m).toBe(42);
});

test('reexported symbol is same instance', () => {
  expect(exportedSymbol).toBe(symbol);
});
