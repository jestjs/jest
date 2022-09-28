/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

describe('Testing the mocking of a class', () => {
  it('can call an instance method', () => {
    class TestClass {
      testMethod(): string {
        return 'testMethod';
      }
    }

    jest.spyOn(TestClass.prototype, 'testMethod').mockImplementation(() => {
      return 'mockTestMethod';
    });
    const testClassInstance = new TestClass();
    expect(testClassInstance.testMethod()).toEqual('mockTestMethod');
  });

  it('can call a superclass instance method', () => {
    class SuperTestClass {
      testMethod(): string {
        return 'testMethod';
      }
    }

    class TestClass extends SuperTestClass {}

    jest.spyOn(TestClass.prototype, 'testMethod').mockImplementation(() => {
      return 'mockTestMethod';
    });
    const testClassInstance = new TestClass();
    expect(testClassInstance.testMethod()).toEqual('mockTestMethod');
  });

  it('can read a value from an instance getter', () => {
    class TestClass {
      get testMethod(): string {
        return 'testMethod';
      }
    }

    jest
      .spyOn(TestClass.prototype, 'testMethod', 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new TestClass();
    expect(testClassInstance.testMethod).toEqual('mockTestMethod');
  });

  it('can read a value from an superclass instance getter', () => {
    class SuperTestClass {
      get testMethod(): string {
        return 'testMethod';
      }
    }

    class TestClass extends SuperTestClass {}

    jest
      .spyOn(TestClass.prototype, 'testMethod', 'get')
      .mockImplementation(() => {
        return 'mockTestMethod';
      });
    const testClassInstance = new TestClass();
    expect(testClassInstance.testMethod).toEqual('mockTestMethod');
  });

  it('can write a value to an instance setter', () => {
    class TestClass {
      // eslint-disable-next-line accessor-pairs
      set testMethod(_x: string) {
        return;
      }
    }

    const mocktestMethod = jest
      .spyOn(TestClass.prototype, 'testMethod', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    const testClassInstance = new TestClass();
    testClassInstance.testMethod = '';
    expect(mocktestMethod).toHaveBeenCalledTimes(1);
  });

  it('can write a value to a superclass instance setter', () => {
    class SuperTestClass {
      // eslint-disable-next-line accessor-pairs
      set testMethod(_x: string) {
        return;
      }
    }

    class TestClass extends SuperTestClass {}

    const mocktestMethod = jest
      .spyOn(TestClass.prototype, 'testMethod', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    const testClassInstance = new TestClass();
    testClassInstance.testMethod = '';
    expect(mocktestMethod).toHaveBeenCalledTimes(1);
  });

  it('can read a value from a static getter', () => {
    class TestClass {
      static get testMethod(): string {
        return 'testMethod';
      }
    }

    jest.spyOn(TestClass, 'testMethod', 'get').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.testMethod).toEqual('mockTestMethod');
  });

  it('can read a value from a superclass static getter', () => {
    class SuperTestClass {
      static get testMethod(): string {
        return 'testMethod';
      }
    }

    class TestClass extends SuperTestClass {}

    jest.spyOn(TestClass, 'testMethod', 'get').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.testMethod).toEqual('mockTestMethod');
  });

  it('can write a value to a static setter', () => {
    class TestClass {
      // eslint-disable-next-line accessor-pairs
      static set testMethod(_x: string) {
        return;
      }
    }

    const mocktestMethod = jest
      .spyOn(TestClass, 'testMethod', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    TestClass.testMethod = '';
    expect(mocktestMethod).toHaveBeenCalledTimes(1);
  });

  it('can write a value to a superclass static setter', () => {
    class SuperTestClass {
      // eslint-disable-next-line accessor-pairs
      static set testMethod(_x: string) {
        return;
      }
    }

    class TestClass extends SuperTestClass {}

    const mocktestMethod = jest
      .spyOn(TestClass, 'testMethod', 'set')
      .mockImplementation((_x: string) => {
        return () => {};
      });
    TestClass.testMethod = '';
    expect(mocktestMethod).toHaveBeenCalledTimes(1);
  });
});
