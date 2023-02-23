/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {fn} from 'fake-dep';

test('returns correct message', () => {
  expect(fn()).toBe('hello from ESM');
});
