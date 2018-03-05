/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// This file is missing 'use strict' to force babel into doing something
// as we have `transform-strict-mode`

it('no ancestors', () => {
  expect(true).toBeTruthy();
});

describe('nested', () => {
  it('also works', () => {
    expect(true).toBeTruthy();
  });
});
