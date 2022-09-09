/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const {getTruthy} = require('../index');

describe('in describe', () => {
  test('outer test', () => {
    expect(getTruthy()).toBeTruthy();

    test('inner test', () => {
      expect(getTruthy()).toBeTruthy();
    });
  });
});
