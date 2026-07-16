/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable jest/no-focused-tests */

'use strict';

describe('describe', () => {
  it('it', () => {
    expect(1).toBe(1);
  });
});

describe.only('describe only', () => {
  it.only('it only', () => {
    expect(1).toBe(1);
  });

  it('it', () => {
    expect(1).toBe(1);
  });
});
