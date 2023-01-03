/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

describe('with mock reset', () => {
  const myObject = {bar: () => 'bar'};

  let barStub;

  beforeAll(() => {
    barStub = jest.spyOn(myObject, 'bar');
  });

  test('after mock reset, bar should return to its original value', () => {
    barStub.mockReturnValue('POTATO!');
    expect(myObject.bar()).toBe('POTATO!');
    barStub.mockReset();

    // This expect should be successful
    expect(myObject.bar()).toBe('bar');
  });
});

describe('with reset all mocks', () => {
  const myObject = {bar: () => 'bar', foo: () => 'foo'};

  let barStub;

  beforeAll(() => {
    barStub = jest.spyOn(myObject, 'bar');
  });

  test('after reset all, bar should return to its original value', () => {
    barStub.mockReturnValue('POTATO!');
    expect(myObject.bar()).toBe('POTATO!');
    jest.resetAllMocks();

    // This expect should be successful
    expect(myObject.bar()).toBe('bar');
  });
});
