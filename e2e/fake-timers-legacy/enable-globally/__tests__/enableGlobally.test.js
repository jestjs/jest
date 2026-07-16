/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('getRealSystemTime', () => {
  expect(() => jest.getRealSystemTime()).toThrow(
    '`jest.getRealSystemTime()` is not available when using legacy fake timers.',
  );
});
