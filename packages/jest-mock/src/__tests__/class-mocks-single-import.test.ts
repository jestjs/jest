/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import SuperTestClass, {TestClass} from './__fixtures__/class-mocks-types';
jest.mock('./__fixtures__/class-mocks-types');

describe('Testing the mocking of a class hierarchy defined in a single import', () => {
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

  it('can call an instance method named "get" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass.prototype, 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new SuperTestClass();
    expect(testClassInstance.get()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call a superclass instance method named "get" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass.prototype, 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new TestClass();
    expect(testClassInstance.get()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call an instance method named "set" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass.prototype, 'set')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new SuperTestClass();
    expect(testClassInstance.set()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call a superclass instance method named "set" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass.prototype, 'set')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new TestClass();
    expect(testClassInstance.set()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
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

  it('can call a static method - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass, 'staticTestMethod')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(SuperTestClass.staticTestMethod()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call a superclass static method - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass, 'staticTestMethod')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(TestClass.staticTestMethod()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);
  });

  it('can call a static method named "get" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass, 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(SuperTestClass.get()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call a superclass static method named "get" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass, 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(TestClass.get()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call a static method named "set" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(SuperTestClass, 'set')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(SuperTestClass.set()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });

  it('can call a superclass static method named "set" - Auto-mocked class', () => {
    const mockTestMethod = jest
      .spyOn(TestClass, 'set')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(TestClass.set()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
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
