/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const {package2} = require('../index');

describe('Example Package 2 Test', () => {
  it('should run', () => {
    expect(package2()).toBeTruthy();
  });
});
