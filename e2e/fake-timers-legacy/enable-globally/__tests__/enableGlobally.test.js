/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

test('getRealSystemTime', () => {
  expect(() => jest.getRealSystemTime()).toThrow(
    'getRealSystemTime is not available when not using modern timers',
  );
});

test('setSystemTime', () => {
  expect(() => jest.setSystemTime(0)).toThrow(
    'setSystemTime is not available when not using modern timers',
  );
});
