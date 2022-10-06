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
    expect(testClassInstance.testMethod()).toBe('mockTestMethod');
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
    expect(testClassInstance.testMethod()).toBe('mockTestMethod');
  });

  it('can call an instance method named "get"', () => {
    class TestClass {
      get(): string {
        return 'get';
      }
    }

    jest.spyOn(TestClass.prototype, 'get').mockImplementation(() => {
      return 'mockTestMethod';
    });
    const testClassInstance = new TestClass();
    expect(testClassInstance.get()).toBe('mockTestMethod');
  });

  it('can call a superclass instance method named "get"', () => {
    class SuperTestClass {
      get(): string {
        return 'get';
      }
    }

    class TestClass extends SuperTestClass {}

    jest.spyOn(TestClass.prototype, 'get').mockImplementation(() => {
      return 'mockTestMethod';
    });
    const testClassInstance = new TestClass();
    expect(testClassInstance.get()).toBe('mockTestMethod');
  });

  it('can call an instance method named "set"', () => {
    class TestClass {
      set(): string {
        return 'set';
      }
    }

    jest.spyOn(TestClass.prototype, 'set').mockImplementation(() => {
      return 'mockTestMethod';
    });
    const testClassInstance = new TestClass();
    expect(testClassInstance.set()).toBe('mockTestMethod');
  });

  it('can call a superclass instance method named "set"', () => {
    class SuperTestClass {
      set(): string {
        return 'set';
      }
    }

    class TestClass extends SuperTestClass {}

    jest.spyOn(TestClass.prototype, 'set').mockImplementation(() => {
      return 'mockTestMethod';
    });
    const testClassInstance = new TestClass();
    expect(testClassInstance.set()).toBe('mockTestMethod');
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
    expect(testClassInstance.testMethod).toBe('mockTestMethod');
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
    expect(testClassInstance.testMethod).toBe('mockTestMethod');
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

  it('can call a static method', () => {
    class TestClass {
      static testMethod(): string {
        return 'testMethod';
      }
    }

    jest.spyOn(TestClass, 'testMethod').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.testMethod()).toBe('mockTestMethod');
  });

  it('can call a superclass static method', () => {
    class SuperTestClass {
      static testMethod(): string {
        return 'testMethod';
      }
    }

    class TestClass extends SuperTestClass {}

    jest.spyOn(TestClass, 'testMethod').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.testMethod()).toBe('mockTestMethod');
  });

  it('can call a static method named "get"', () => {
    class TestClass {
      static get(): string {
        return 'get';
      }
    }

    jest.spyOn(TestClass, 'get').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.get()).toBe('mockTestMethod');
  });

  it('can call a superclass static method named "get"', () => {
    class SuperTestClass {
      static get(): string {
        return 'get';
      }
    }

    class TestClass extends SuperTestClass {}

    jest.spyOn(TestClass, 'get').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.get()).toBe('mockTestMethod');
  });

  it('can call a static method named "set"', () => {
    class TestClass {
      static set(): string {
        return 'set';
      }
    }

    jest.spyOn(TestClass, 'set').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.set()).toBe('mockTestMethod');
  });

  it('can call a superclass static method named "set"', () => {
    class SuperTestClass {
      static set(): string {
        return 'set';
      }
    }

    class TestClass extends SuperTestClass {}

    jest.spyOn(TestClass, 'set').mockImplementation(() => {
      return 'mockTestMethod';
    });
    expect(TestClass.set()).toBe('mockTestMethod');
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
    expect(TestClass.testMethod).toBe('mockTestMethod');
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
    expect(TestClass.testMethod).toBe('mockTestMethod');
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
