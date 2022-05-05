/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('fake timers', () => {
  jest.useFakeTimers({
    legacyFakeTimers: true,
  });

  expect(() => jest.setSystemTime(0)).toThrow(
    '`jest.setSystemTime()` is not available when using legacy fake timers.',
  );
});
