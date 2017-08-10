/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const vm = require('vm');

describe('moduleMocker', () => {
  let moduleMocker;

  beforeEach(() => {
    const mock = require('../');
    const global = vm.runInNewContext('this');
    moduleMocker = new mock.ModuleMocker(global);
  });

  describe('getMetadata', () => {
    it('returns the function `name` property', () => {
      function x() {}
      const metadata = moduleMocker.getMetadata(x);
      expect(x.name).toBe('x');
      expect(metadata.name).toBe('x');
    });

    it('mocks constant values', () => {
      const metadata = moduleMocker.getMetadata(Symbol.for('bowties.are.cool'));
      expect(metadata.value).toEqual(Symbol.for('bowties.are.cool'));
      expect(moduleMocker.getMetadata('banana').value).toEqual('banana');
      expect(moduleMocker.getMetadata(27).value).toEqual(27);
      expect(moduleMocker.getMetadata(false).value).toEqual(false);
    });

    it('does not retrieve metadata for arrays', () => {
      const array = [1, 2, 3];
      const metadata = moduleMocker.getMetadata(array);
      expect(metadata.value).toBeUndefined();
      expect(metadata.members).toBeUndefined();
      expect(metadata.type).toEqual('array');
    });

    it('does not retrieve metadata for undefined', () => {
      const metadata = moduleMocker.getMetadata(undefined);
      expect(metadata.value).toBeUndefined();
      expect(metadata.members).toBeUndefined();
      expect(metadata.type).toEqual('undefined');
    });

    it('does not retrieve metadata for null', () => {
      const metadata = moduleMocker.getMetadata(null);
      expect(metadata.value).toBeNull();
      expect(metadata.members).toBeUndefined();
      expect(metadata.type).toEqual('null');
    });
  });

  describe('generateFromMetadata', () => {
    it('forwards the function name property', () => {
      function foo() {}
      const mock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo),
      );
      expect(mock.name).toBe('foo');
    });

    it('escapes illegal characters in function name property', () => {
      const foo = {
        'foo-bar': () => {},
      };

      const mock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo['foo-bar']),
      );
      expect(!mock.name || mock.name === 'foo$bar').toBeTruthy();
    });

    it('special cases the mockConstructor name', () => {
      function mockConstructor() {}
      const mock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(mockConstructor),
      );
      // Depends on node version
      expect(!mock.name || mock.name === 'mockConstructor').toBeTruthy();
    });

    it('wont interfere with previous mocks on a shared prototype', () => {
      const ClassFoo = function() {};
      ClassFoo.prototype.x = () => {};
      const ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo),
      );
      const foo = new ClassFooMock();
      const bar = new ClassFooMock();

      foo.x.mockImplementation(() => {
        return 'Foo';
      });
      bar.x.mockImplementation(() => {
        return 'Bar';
      });

      expect(foo.x()).toBe('Foo');
      expect(bar.x()).toBe('Bar');
    });

    it('does not mock non-enumerable getters', () => {
      const foo = Object.defineProperties(
        {},
        {
          nonEnumGetter: {
            get: () => {
              throw new Error();
            },
          },
          nonEnumMethod: {
            value: () => {},
          },
        },
      );
      const mock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo),
      );

      expect(typeof foo.nonEnumMethod).toBe('function');

      expect(mock.nonEnumMethod.mock).not.toBeUndefined();
      expect(mock.nonEnumGetter).toBeUndefined();
    });

    it('mocks getters of ES modules', () => {
      const foo = Object.defineProperties(
        {},
        {
          __esModule: {
            value: true,
          },
          enumGetter: {
            enumerable: true,
            get: () => 10,
          },
        },
      );
      const mock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo),
      );
      expect(mock.enumGetter).toBeDefined();
    });

    it('mocks ES2015 non-enumerable methods', () => {
      class ClassFoo {
        foo() {}
        toString() {
          return 'Foo';
        }
      }

      const ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo),
      );
      const foo = new ClassFooMock();

      const instanceFoo = new ClassFoo();
      const instanceFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(instanceFoo),
      );

      expect(typeof foo.foo).toBe('function');
      expect(typeof instanceFooMock.foo).toBe('function');
      expect(instanceFooMock.foo.mock).not.toBeUndefined();

      expect(instanceFooMock.toString.mock).not.toBeUndefined();
    });

    it('mocks methods that are bound multiple times', () => {
      const func = function func() {};
      const multipleBoundFunc = func.bind(null).bind(null);

      const multipleBoundFuncMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(multipleBoundFunc),
      );

      expect(typeof multipleBoundFuncMock).toBe('function');
    });

    it('mocks methods that are bound after mocking', () => {
      const fooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(() => {}),
      );

      const barMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(fooMock.bind(null)),
      );

      expect(barMock).not.toThrow();
    });

    it('mocks regexp instances', () => {
      expect(() =>
        moduleMocker.generateFromMetadata(moduleMocker.getMetadata(/a/)),
      ).not.toThrow();
    });

    describe('mocked functions', () => {
      it('tracks calls to mocks', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.calls).toEqual([]);

        fn(1, 2, 3);
        expect(fn.mock.calls).toEqual([[1, 2, 3]]);

        fn('a', 'b', 'c');
        expect(fn.mock.calls).toEqual([[1, 2, 3], ['a', 'b', 'c']]);
      });

      it('tracks instances made by mocks', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.instances).toEqual([]);

        const instance1 = new fn();
        expect(fn.mock.instances[0]).toBe(instance1);

        const instance2 = new fn();
        expect(fn.mock.instances[1]).toBe(instance2);
      });

      it('supports clearing mock calls', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.calls).toEqual([]);

        fn(1, 2, 3);
        expect(fn.mock.calls).toEqual([[1, 2, 3]]);

        fn.mockReturnValue('abcd');

        fn.mockClear();
        expect(fn.mock.calls).toEqual([]);

        fn('a', 'b', 'c');
        expect(fn.mock.calls).toEqual([['a', 'b', 'c']]);

        expect(fn()).toEqual('abcd');
      });

      it('supports clearing mocks', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.calls).toEqual([]);

        fn(1, 2, 3);
        expect(fn.mock.calls).toEqual([[1, 2, 3]]);

        fn.mockClear();
        expect(fn.mock.calls).toEqual([]);

        fn('a', 'b', 'c');
        expect(fn.mock.calls).toEqual([['a', 'b', 'c']]);
      });

      it('supports clearing all mocks', () => {
        const fn1 = moduleMocker.fn();
        fn1.mockImplementation(() => 'abcd');
        fn1(1, 2, 3);
        expect(fn1.mock.calls).toEqual([[1, 2, 3]]);

        const fn2 = moduleMocker.fn();
        fn2.mockReturnValue('abcde');
        fn2('a', 'b', 'c', 'd');
        expect(fn2.mock.calls).toEqual([['a', 'b', 'c', 'd']]);

        moduleMocker.clearAllMocks();
        expect(fn1.mock.calls).toEqual([]);
        expect(fn2.mock.calls).toEqual([]);
        expect(fn1()).toEqual('abcd');
        expect(fn2()).toEqual('abcde');
      });

      it('supports resetting mock return values', () => {
        const fn = moduleMocker.fn();
        fn.mockReturnValue('abcd');

        const before = fn();
        expect(before).toEqual('abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toEqual('abcd');
      });

      it('supports resetting single use mock return values', () => {
        const fn = moduleMocker.fn();
        fn.mockReturnValueOnce('abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toEqual('abcd');
      });

      it('supports resetting mock implementations', () => {
        const fn = moduleMocker.fn();
        fn.mockImplementation(() => 'abcd');

        const before = fn();
        expect(before).toEqual('abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toEqual('abcd');
      });

      it('supports resetting single use mock implementations', () => {
        const fn = moduleMocker.fn();
        fn.mockImplementationOnce(() => 'abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toEqual('abcd');
      });

      it('supports resetting all mocks', () => {
        const fn1 = moduleMocker.fn();
        fn1.mockImplementation(() => 'abcd');
        fn1(1, 2, 3);
        expect(fn1.mock.calls).toEqual([[1, 2, 3]]);

        const fn2 = moduleMocker.fn();
        fn2.mockReturnValue('abcd');
        fn2('a', 'b', 'c');
        expect(fn2.mock.calls).toEqual([['a', 'b', 'c']]);

        moduleMocker.resetAllMocks();
        expect(fn1.mock.calls).toEqual([]);
        expect(fn2.mock.calls).toEqual([]);
        expect(fn1()).not.toEqual('abcd');
        expect(fn2()).not.toEqual('abcd');
      });

      it('maintains function arity', () => {
        const mockFunctionArity1 = moduleMocker.fn(x => x);
        const mockFunctionArity2 = moduleMocker.fn((x, y) => y);

        expect(mockFunctionArity1.length).toBe(1);
        expect(mockFunctionArity2.length).toBe(2);
      });
    });

    it('supports mock value returning undefined', () => {
      const obj = {
        func: () => 'some text',
      };

      moduleMocker.spyOn(obj, 'func').mockReturnValue(undefined);

      expect(obj.func()).not.toEqual('some text');
    });

    it('supports mock value once returning undefined', () => {
      const obj = {
        func: () => 'some text',
      };

      moduleMocker.spyOn(obj, 'func').mockReturnValueOnce(undefined);

      expect(obj.func()).not.toEqual('some text');
    });

    it('mockReturnValueOnce mocks value just once', () => {
      const fake = jest.fn(a => a + 2);
      fake.mockReturnValueOnce(42);
      expect(fake(2)).toEqual(42);
      expect(fake(2)).toEqual(4);
    });
  });

  describe('getMockImplementation', () => {
    it('should mock calls to a mock function', () => {
      const mockFn = moduleMocker.fn();

      mockFn.mockImplementation(() => {
        return 'Foo';
      });

      expect(typeof mockFn.getMockImplementation()).toBe('function');
      expect(mockFn.getMockImplementation()()).toBe('Foo');
    });
  });

  describe('mockImplementationOnce', () => {
    it('should mock single call to a mock function', () => {
      const mockFn = moduleMocker.fn();

      mockFn
        .mockImplementationOnce(() => {
          return 'Foo';
        })
        .mockImplementationOnce(() => {
          return 'Bar';
        });

      expect(mockFn()).toBe('Foo');
      expect(mockFn()).toBe('Bar');
      expect(mockFn()).toBeUndefined();
    });

    it('should fallback to default mock function when no specific mock is available', () => {
      const mockFn = moduleMocker.fn();

      mockFn
        .mockImplementationOnce(() => {
          return 'Foo';
        })
        .mockImplementationOnce(() => {
          return 'Bar';
        })
        .mockImplementation(() => {
          return 'Default';
        });

      expect(mockFn()).toBe('Foo');
      expect(mockFn()).toBe('Bar');
      expect(mockFn()).toBe('Default');
      expect(mockFn()).toBe('Default');
    });
  });

  test('mockImplementation resets the mock', () => {
    const fn = jest.fn();
    expect(fn()).toBeUndefined();
    fn.mockReturnValue('returnValue');
    fn.mockImplementation(() => 'foo');
    expect(fn()).toBe('foo');
  });

  it('should recognize a mocked function', () => {
    const mockFn = moduleMocker.fn();

    expect(moduleMocker.isMockFunction(() => {})).toBe(false);
    expect(moduleMocker.isMockFunction(mockFn)).toBe(true);
  });

  describe('spyOn', () => {
    it('should work', () => {
      let isOriginalCalled = false;
      let originalCallThis;
      let originalCallArguments;
      const obj = {
        method() {
          isOriginalCalled = true;
          originalCallThis = this;
          originalCallArguments = arguments;
        },
      };

      const spy = moduleMocker.spyOn(obj, 'method');

      const thisArg = {this: true};
      const firstArg = {first: true};
      const secondArg = {second: true};
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments.length).toBe(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).toHaveBeenCalled();

      isOriginalCalled = false;
      originalCallThis = null;
      originalCallArguments = null;
      spy.mockReset();
      spy.mockRestore();
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments.length).toBe(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw on invalid input', () => {
      expect(() => {
        moduleMocker.spyOn(null, 'method');
      }).toThrow();
      expect(() => {
        moduleMocker.spyOn({}, 'method');
      }).toThrow();
      expect(() => {
        moduleMocker.spyOn({method: 10}, 'method');
      }).toThrow();
    });

    it('supports restoring all spies', () => {
      let methodOneCalls = 0;
      let methodTwoCalls = 0;
      const obj = {
        methodOne() {
          methodOneCalls++;
        },
        methodTwo() {
          methodTwoCalls++;
        },
      };

      const spy1 = moduleMocker.spyOn(obj, 'methodOne');
      const spy2 = moduleMocker.spyOn(obj, 'methodTwo');

      // First, we call with the spies: both spies and both original functions
      // should be called.
      obj.methodOne();
      obj.methodTwo();
      expect(methodOneCalls).toBe(1);
      expect(methodTwoCalls).toBe(1);
      expect(spy1.mock.calls.length).toBe(1);
      expect(spy2.mock.calls.length).toBe(1);

      moduleMocker.restoreAllMocks();

      // Then, after resetting all mocks, we call methods again. Only the real
      // methods should bump their count, not the spies.
      obj.methodOne();
      obj.methodTwo();
      expect(methodOneCalls).toBe(2);
      expect(methodTwoCalls).toBe(2);
      expect(spy1.mock.calls.length).toBe(1);
      expect(spy2.mock.calls.length).toBe(1);
    });
  });
});
