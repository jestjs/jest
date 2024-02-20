/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const TestClass = require('../');
const localClass = new TestClass();

it('restores a mock after a test if it is mocked with a `using` declaration', () => {
  using mock = jest.spyOn(localClass, 'test').mockImplementation(() => 'ABCD');
  expect(localClass.test()).toBe('ABCD');
  expect(localClass.test).toHaveBeenCalledTimes(1);
  expect(jest.isMockFunction(localClass.test)).toBeTruthy();
});

it('only sees the unmocked class', () => {
  expect(localClass.test()).toBe('12345');
  expect(localClass.test.mock).toBeUndefined();
  expect(jest.isMockFunction(localClass.test)).toBeFalsy();
});

test('also works just with scoped code blocks', () => {
  const scopedInstance = new TestClass();
  {
    using mock = jest
      .spyOn(scopedInstance, 'test')
      .mockImplementation(() => 'ABCD');
    expect(scopedInstance.test()).toBe('ABCD');
    expect(scopedInstance.test).toHaveBeenCalledTimes(1);
    expect(jest.isMockFunction(scopedInstance.test)).toBeTruthy();
  }
  expect(scopedInstance.test()).toBe('12345');
  expect(scopedInstance.test.mock).toBeUndefined();
  expect(jest.isMockFunction(scopedInstance.test)).toBeFalsy();
});

it('jest.fn state should be restored with the `using` keyword', () => {
  const mock = jest.fn();
  {
    using inScope = mock.mockReturnValue(2);
    expect(inScope()).toBe(2);
    expect(mock()).toBe(2);
  }
  expect(mock()).not.toBe(2);
});
