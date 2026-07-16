/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// This file is missing 'use strict' to force babel into doing something
// as we have `transform-strict-mode`

it('it no ancestors', () => {
  expect(true).toBeTruthy();
});

xit('xit no ancestors', () => {
  expect(true).toBeTruthy();
});

// eslint-disable-next-line jest/no-focused-tests
fit('fit no ancestors', () => {
  expect(true).toBeTruthy();
});

it.each([true, true])('it each no ancestors', () => {
  expect(true).toBeTruthy();
});

describe('nested', () => {
  it('it nested', () => {
    expect(true).toBeTruthy();
  });

  xit('xit nested', () => {
    expect(true).toBeTruthy();
  });

  // eslint-disable-next-line jest/no-focused-tests
  fit('fit nested', () => {
    expect(true).toBeTruthy();
  });

  it.each([true, true])('it each nested', () => {
    expect(true).toBeTruthy();
  });
});
