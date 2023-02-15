/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment jest-environment-jsdom
 */

import {fn} from 'fake-dual-dep';

test('returns correct message', () => {
  expect(fn()).toBe('hello from browser');
});
