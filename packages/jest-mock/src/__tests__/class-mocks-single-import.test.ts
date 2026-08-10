/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import SuperTestClass, * as testTypes from './__fixtures__/class-mocks-types';
jest.mock('./__fixtures__/class-mocks-types');

describe('Testing the mocking of exported functions', () => {
  it('can mock a directly exported function', () => {
    jest.spyOn(testTypes, 'testFunction1').mockImplementation(() => {
      return 'mockTestFunction';
    });
    expect(testTypes.testFunction1()).toBe('mockTestFunction');
  });

  it('can mock an indirectly exported function', () => {
    jest.spyOn(testTypes, 'testFunction2').mockImplementation(() => {
      return 'mockTestFunction';
    });
    expect(testTypes.testFunction2()).toBe('mockTestFunction');
  });

  it('can mock an indirectly exported anonymous function', () => {
    jest.spyOn(testTypes, 'testFunction3').mockImplementation(() => {
      return 'mockTestFunction';
    });
    expect(testTypes.testFunction3()).toBe('mockTestFunction');
  });
});

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
      .spyOn(testTypes.TestClass.prototype, 'testMethod')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new testTypes.TestClass();
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
      .spyOn(testTypes.TestClass.prototype, 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new testTypes.TestClass();
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
      .spyOn(testTypes.TestClass.prototype, 'set')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new testTypes.TestClass();
    expect(testClassInstance.set()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
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
      .spyOn(testTypes.TestClass, 'staticTestMethod')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(testTypes.TestClass.staticTestMethod()).toBe('mockTestMethod');
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
      .spyOn(testTypes.TestClass, 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(testTypes.TestClass.get()).toBe('mockTestMethod');
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
      .spyOn(testTypes.TestClass, 'set')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    expect(testTypes.TestClass.set()).toBe('mockTestMethod');
    expect(mockTestMethod).toHaveBeenCalledTimes(1);

    mockTestMethod.mockClear();
  });
});
