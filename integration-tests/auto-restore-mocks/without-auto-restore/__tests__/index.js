/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('../');

const importedFn = require('../');
const localFn = jest.fn(() => 8675309);

describe('without an explicit restore', () => {
  test('first test', () => {
    importedFn();
    const returnVal = localFn();

    expect(importedFn.mock.calls.length).toBe(1);
    expect(localFn.mock.calls.length).toBe(1);
    expect(returnVal).toBe(8675309);
  });

  test('second test', () => {
    importedFn();
    const returnVal = localFn();

    expect(importedFn.mock.calls.length).toBe(2);
    expect(localFn.mock.calls.length).toBe(2);
    expect(returnVal).toBe(8675309);
  });
});

describe('with an explicit restore', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('first test', () => {
    importedFn();
    const returnVal = localFn();

    expect(importedFn.mock.calls.length).toBe(1);
    expect(localFn.mock.calls.length).toBe(1);
    expect(returnVal).toBe(8675309);
  });

  test('second test', () => {
    importedFn();
    const returnVal = localFn();

    expect(importedFn.mock.calls.length).toBe(1);
    expect(localFn.mock.calls.length).toBe(1);
    expect(returnVal).not.toBe(8675309);
  });
});
