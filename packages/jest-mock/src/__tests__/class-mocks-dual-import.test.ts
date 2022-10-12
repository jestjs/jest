/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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

  it('can read a value from an instance getter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass.prototype, 'testAccessor', 'get')
      .mockImplementation(() => {
        return 'mockTestAccessor';
      });
    const testClassInstance = new SuperTestClass();
    expect(testClassInstance.testAccessor).toBe('mockTestAccessor');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can read a value from a superclass instance getter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass.prototype, 'testAccessor', 'get')
      .mockImplementation(() => {
        return 'mockTestAccessor';
      });
    const testClassInstance = new TestClass();
    expect(testClassInstance.testAccessor).toBe('mockTestAccessor');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);
  });

  it('can write a value to an instance setter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass.prototype, 'testAccessor', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    const testClassInstance = new SuperTestClass();
    testClassInstance.testAccessor = '';
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can write a value to a superclass instance setter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass.prototype, 'testAccessor', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    const testClassInstance = new TestClass();
    testClassInstance.testAccessor = '';
    expect(mockTestMethod).toHaveBeenCalledTimes(1);
  });

  it('can read a value from a static getter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass, 'staticTestAccessor', 'get')
      .mockImplementation(() => {
        return 'mockStaticTestAccessor';
      });
    expect(SuperTestClass.staticTestAccessor).toBe('mockStaticTestAccessor');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can read a value from a superclass static getter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass, 'staticTestAccessor', 'get')
      .mockImplementation(() => {
        return 'mockStaticTestAccessor';
      });
    expect(TestClass.staticTestAccessor).toBe('mockStaticTestAccessor');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);
  });

  it('can write a value to a static setter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass, 'staticTestAccessor', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    SuperTestClass.staticTestAccessor = '';
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can write a value to a superclass static setter - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass, 'staticTestAccessor', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    TestClass.staticTestAccessor = '';
    expect(mockTestMethod).toHaveBeenCalledTimes(1);
  });
});
