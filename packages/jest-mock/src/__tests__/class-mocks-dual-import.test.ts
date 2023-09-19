/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {SuperTestClass} from './__fixtures__/SuperTestClass';
import TestClass from './__fixtures__/TestClass';
jest.mock('./__fixtures__/SuperTestClass');
jest.mock('./__fixtures__/TestClass');

describe('Testing the mocking of a class hierarchy defined in multiple imports', () => {
  it('can call an instance method - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass.prototype, 'testMethod')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new SuperTestClass();
    expect(testClassInstance.testMethod()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call a superclass instance method - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass.prototype, 'testMethod')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new TestClass();
    expect(testClassInstance.testMethod()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);
  });
});
