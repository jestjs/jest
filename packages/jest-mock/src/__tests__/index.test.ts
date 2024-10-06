/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable local/ban-types-eventually, local/prefer-rest-params-eventually */

import * as util from 'util';
import {type Context, createContext, runInContext, runInNewContext} from 'vm';
import {ModuleMocker, fn, mocked, spyOn} from '../';

describe('moduleMocker', () => {
  let moduleMocker: ModuleMocker;
  let mockContext: Context;
  let mockGlobals: typeof globalThis;

  beforeEach(() => {
    mockContext = createContext();
    mockGlobals = runInNewContext('this', mockContext);
    moduleMocker = new ModuleMocker(mockGlobals);
  });

  describe('getMetadata', () => {
    it('returns the function `name` property', () => {
      function x() {}
      const metadata = moduleMocker.getMetadata(x);
      expect(x.name).toBe('x');
      expect(metadata!.name).toBe('x');
    });

    it('does not return broken name property', () => {
      class By {
        // @ts-expect-error
        static name() {
          return 'this is not a name';
        }
      }
      const metadata = moduleMocker.getMetadata(By);
      expect(typeof By.name).toBe('function');
      expect(metadata).not.toHaveProperty('name');
    });

    it('mocks constant values', () => {
      const metadata = moduleMocker.getMetadata(Symbol.for('bowties.are.cool'));
      expect(metadata.value).toEqual(Symbol.for('bowties.are.cool'));
      expect(moduleMocker.getMetadata('banana').value).toBe('banana');
      expect(moduleMocker.getMetadata(27).value).toBe(27);
      expect(moduleMocker.getMetadata(false).value).toBe(false);
      expect(moduleMocker.getMetadata(Number.POSITIVE_INFINITY).value).toEqual(
        Number.POSITIVE_INFINITY,
      );
    });

    it('does not retrieve metadata for arrays', () => {
      const array = [1, 2, 3];
      const metadata = moduleMocker.getMetadata(array);
      expect(metadata.value).toBeUndefined();
      expect(metadata.members).toBeUndefined();
      expect(metadata.type).toBe('array');
    });

    it('does not retrieve metadata for undefined', () => {
      const metadata = moduleMocker.getMetadata(undefined);
      expect(metadata.value).toBeUndefined();
      expect(metadata.members).toBeUndefined();
      expect(metadata.type).toBe('undefined');
    });

    it('does not retrieve metadata for null', () => {
      const metadata = moduleMocker.getMetadata(null);
      expect(metadata.value).toBeNull();
      expect(metadata.members).toBeUndefined();
      expect(metadata.type).toBe('null');
    });

    it('retrieves metadata for ES6 classes', () => {
      class ClassFooMock {
        bar() {}
      }
      const fooInstance = new ClassFooMock();
      const metadata = moduleMocker.getMetadata(fooInstance);
      expect(metadata.type).toBe('object');
      expect(metadata.members.constructor.name).toBe('ClassFooMock');
    });

    it('retrieves synchronous function metadata', () => {
      function functionFooMock() {}
      const metadata = moduleMocker.getMetadata(functionFooMock);
      expect(metadata.type).toBe('function');
      expect(metadata.name).toBe('functionFooMock');
    });

    it('retrieves asynchronous function metadata', () => {
      async function asyncFunctionFooMock() {}
      const metadata = moduleMocker.getMetadata(asyncFunctionFooMock);
      expect(metadata.type).toBe('function');
      expect(metadata.name).toBe('asyncFunctionFooMock');
    });

    it("retrieves metadata for object literals and it's members", () => {
      const metadata = moduleMocker.getMetadata({
        bar: 'two',
        foo: 1,
      });
      expect(metadata.type).toBe('object');
      expect(metadata.members.bar.value).toBe('two');
      expect(metadata.members.bar.type).toBe('constant');
      expect(metadata.members.foo.value).toBe(1);
      expect(metadata.members.foo.type).toBe('constant');
    });

    it('retrieves Date object metadata', () => {
      const metadata = moduleMocker.getMetadata(Date);
      expect(metadata.type).toBe('function');
      expect(metadata.name).toBe('Date');
      expect(metadata.members.now.name).toBe('now');
      expect(metadata.members.parse.name).toBe('parse');
      expect(metadata.members.UTC.name).toBe('UTC');
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

    it('fixes illegal function name properties', () => {
      function getMockFnWithOriginalName(name) {
        const fn = () => {};
        Object.defineProperty(fn, 'name', {value: name});

        return moduleMocker.generateFromMetadata(moduleMocker.getMetadata(fn));
      }

      expect(getMockFnWithOriginalName('1').name).toBe('$1');
      expect(getMockFnWithOriginalName('foo-bar').name).toBe('foo$bar');
      expect(getMockFnWithOriginalName('foo-bar-2').name).toBe('foo$bar$2');
      expect(getMockFnWithOriginalName('foo-bar-3').name).toBe('foo$bar$3');
      expect(getMockFnWithOriginalName('foo/bar').name).toBe('foo$bar');
      expect(getMockFnWithOriginalName('foo𠮷bar').name).toBe('foo𠮷bar');
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
      const ClassFoo = function () {};
      ClassFoo.prototype.x = () => {};
      const ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo),
      );
      const foo = new ClassFooMock();
      const bar = new ClassFooMock();

      foo.x.mockImplementation(() => 'Foo');
      bar.x.mockImplementation(() => 'Bar');

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

      expect(mock.nonEnumMethod.mock).toBeDefined();
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

    it('handles custom toString of transpiled modules', () => {
      const foo = Object.defineProperties(
        {foo: 'bar'},
        {
          __esModule: {value: true},
          [Symbol.toStringTag]: {value: 'Module'},
        },
      );
      const mock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(foo),
      );
      expect(mock.foo).toBeDefined();
    });

    it('mocks ES2015 non-enumerable methods', () => {
      class ClassFoo {
        foo() {}
        toString() {
          return 'Foo';
        }
      }

      const ClassFooMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassFoo)!,
      );
      const foo = new ClassFooMock();
      expect(typeof foo.foo).toBe('function');
      expect(foo.foo.mock).toBeDefined();

      expect(foo.toString.mock).toBeDefined();
    });

    it('mocks ES2015 non-enumerable static properties and methods', () => {
      class ClassFoo {
        static foo() {}
        static fooProp: Function;
      }
      ClassFoo.fooProp = () => {};

      class ClassBar extends ClassFoo {}

      const ClassBarMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(ClassBar),
      );

      expect(typeof ClassBarMock.foo).toBe('function');
      expect(typeof ClassBarMock.fooProp).toBe('function');
      expect(ClassBarMock.foo.mock).toBeDefined();
      expect(ClassBarMock.fooProp.mock).toBeDefined();
    });

    it('mocks methods in all the prototype chain (null prototype)', () => {
      const Foo = Object.assign(Object.create(null), {foo() {}});
      const Bar = Object.assign(Object.create(Foo), {bar() {}});

      const BarMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(Bar),
      );
      expect(typeof BarMock.foo).toBe('function');
      expect(typeof BarMock.bar).toBe('function');
    });

    it('does not mock methods from Object.prototype', () => {
      const Foo = {foo() {}};
      const Bar = Object.assign(Object.create(Foo), {bar() {}});

      const BarMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(Bar),
      );

      expect(BarMock).toBeInstanceOf(mockGlobals.Object);
      expect(
        Object.prototype.hasOwnProperty.call(BarMock, 'hasOwnProperty'),
      ).toBe(false);
      expect(BarMock.hasOwnProperty).toBe(
        mockGlobals.Object.prototype.hasOwnProperty,
      );
    });

    it('does not mock methods from Object.prototype (in mock context)', () => {
      const Bar = runInContext(
        `
          const Foo = { foo() {} };
          const Bar = Object.assign(Object.create(Foo), { bar() {} });
          Bar;
        `,
        mockContext,
      );

      const BarMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(Bar),
      );

      expect(BarMock).toBeInstanceOf(mockGlobals.Object);
      expect(
        Object.prototype.hasOwnProperty.call(BarMock, 'hasOwnProperty'),
      ).toBe(false);
      expect(BarMock.hasOwnProperty).toBe(
        mockGlobals.Object.prototype.hasOwnProperty,
      );
    });

    it('does not mock methods from Function.prototype', () => {
      class Foo {}
      class Bar extends Foo {}

      const BarMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(Bar),
      );

      expect(BarMock).toBeInstanceOf(mockGlobals.Function);
      expect(Object.prototype.hasOwnProperty.call(BarMock, 'bind')).toBe(false);
      expect(BarMock.bind).toBe(mockGlobals.Function.prototype.bind);
    });

    it('does not mock methods from Function.prototype (in mock context)', () => {
      const Bar = runInContext(
        `
          class Foo {}
          class Bar extends Foo {}
          Bar;
        `,
        mockContext,
      );

      const BarMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(Bar),
      );

      expect(BarMock).toBeInstanceOf(mockGlobals.Function);
      expect(Object.prototype.hasOwnProperty.call(BarMock, 'bind')).toBe(false);
      expect(BarMock.bind).toBe(mockGlobals.Function.prototype.bind);
    });

    it('does not mock methods from RegExp.prototype', () => {
      const bar = /bar/;

      const barMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(bar),
      );

      expect(barMock).toBeInstanceOf(mockGlobals.RegExp);
      expect(Object.prototype.hasOwnProperty.call(barMock, 'test')).toBe(false);
      expect(barMock.test).toBe(mockGlobals.RegExp.prototype.test);
    });

    it('does not mock methods from RegExp.prototype (in mock context)', () => {
      const bar = runInContext(
        `
          const bar = /bar/;
          bar;
        `,
        mockContext,
      );

      const barMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(bar),
      );

      expect(barMock).toBeInstanceOf(mockGlobals.RegExp);
      expect(Object.prototype.hasOwnProperty.call(barMock, 'test')).toBe(false);
      expect(barMock.test).toBe(mockGlobals.RegExp.prototype.test);
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

    it('mocks functions with numeric names', () => {
      const obj = {
        1: () => {},
      };

      const objMock = moduleMocker.generateFromMetadata(
        moduleMocker.getMetadata(obj),
      );

      expect(typeof objMock[1]).toBe('function');
    });

    describe('mocked functions', () => {
      it('tracks calls to mocks', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.calls).toEqual([]);

        fn(1, 2, 3);
        expect(fn.mock.calls).toEqual([[1, 2, 3]]);

        fn('a', 'b', 'c');
        expect(fn.mock.calls).toEqual([
          [1, 2, 3],
          ['a', 'b', 'c'],
        ]);
      });

      it('tracks instances made by mocks', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.instances).toEqual([]);

        const instance1 = new fn();
        expect(fn.mock.instances[0]).toBe(instance1);

        const instance2 = new fn();
        expect(fn.mock.instances[1]).toBe(instance2);
      });

      it('tracks context objects passed to mock calls', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.instances).toEqual([]);

        const ctx0 = {};
        fn.apply(ctx0, []);
        expect(fn.mock.contexts[0]).toBe(ctx0);

        const ctx1 = {};
        fn.call(ctx1);
        expect(fn.mock.contexts[1]).toBe(ctx1);

        const ctx2 = {};
        const bound2 = fn.bind(ctx2);
        bound2();
        expect(fn.mock.contexts[2]).toBe(ctx2);

        // null context
        fn.apply(null, []); // eslint-disable-line no-useless-call
        expect(fn.mock.contexts[3]).toBeNull();
        fn.call(null); // eslint-disable-line no-useless-call
        expect(fn.mock.contexts[4]).toBeNull();
        fn.bind(null)();
        expect(fn.mock.contexts[5]).toBeNull();

        // Unspecified context is `undefined` in strict mode (like in this test) and `window` otherwise.
        fn();
        expect(fn.mock.contexts[6]).toBeUndefined();
      });

      it('supports clearing mock calls', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.calls).toEqual([]);

        fn(1, 2, 3);
        expect(fn.mock.calls).toEqual([[1, 2, 3]]);
        expect(fn.mock.contexts).toEqual([undefined]);

        fn.mockReturnValue('abcd');

        fn.mockClear();
        expect(fn.mock.calls).toEqual([]);
        expect(fn.mock.contexts).toEqual([]);

        fn('a', 'b', 'c');
        expect(fn.mock.calls).toEqual([['a', 'b', 'c']]);
        expect(fn.mock.contexts).toEqual([undefined]);

        expect(fn()).toBe('abcd');
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
        expect(fn1()).toBe('abcd');
        expect(fn2()).toBe('abcde');
      });

      it('supports resetting mock return values', () => {
        const fn = moduleMocker.fn();
        fn.mockReturnValue('abcd');

        const before = fn();
        expect(before).toBe('abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toBe('abcd');
      });

      it('supports resetting single use mock return values', () => {
        const fn = moduleMocker.fn();
        fn.mockReturnValueOnce('abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toBe('abcd');
      });

      it('supports resetting mock implementations', () => {
        const fn = moduleMocker.fn();
        fn.mockImplementation(() => 'abcd');

        const before = fn();
        expect(before).toBe('abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toBe('abcd');
      });

      it('supports resetting single use mock implementations', () => {
        const fn = moduleMocker.fn();
        fn.mockImplementationOnce(() => 'abcd');

        fn.mockReset();

        const after = fn();
        expect(after).not.toBe('abcd');
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
        expect(fn1()).not.toBe('abcd');
        expect(fn2()).not.toBe('abcd');
      });

      it('is not affected by restoreAllMocks', () => {
        const fn1 = moduleMocker.fn();
        fn1.mockImplementation(() => 'abcd');
        fn1(1, 2, 3);
        expect(fn1.mock.calls).toEqual([[1, 2, 3]]);
        moduleMocker.restoreAllMocks();
        expect(fn1(1)).toBe('abcd');
        expect(fn1.mock.calls).toEqual([[1, 2, 3], [1]]);
      });

      it('is cleared and stubbed when restored explicitly', () => {
        const fn1 = moduleMocker.fn();
        fn1.mockImplementation(() => 'abcd');
        fn1(1, 2, 3);
        expect(fn1.mock.calls).toEqual([[1, 2, 3]]);
        fn1.mockRestore();
        expect(fn1(1)).toBeUndefined();
        expect(fn1.mock.calls).toEqual([[1]]);
      });

      it('maintains function arity', () => {
        const mockFunctionArity1 = moduleMocker.fn(x => x);
        const mockFunctionArity2 = moduleMocker.fn((x, y) => y);

        expect(mockFunctionArity1).toHaveLength(1);
        expect(mockFunctionArity2).toHaveLength(2);
      });
    });

    it('mocks the method in the passed object itself', () => {
      const parent = {func: () => 'abcd'};
      const child = Object.create(parent);

      moduleMocker.spyOn(child, 'func').mockReturnValue('efgh');

      expect(Object.prototype.hasOwnProperty.call(child, 'func')).toBe(true);
      expect(child.func()).toBe('efgh');
      expect(parent.func()).toBe('abcd');
    });

    it('should delete previously inexistent methods when restoring', () => {
      const parent = {func: () => 'abcd'};
      const child = Object.create(parent);

      moduleMocker.spyOn(child, 'func').mockReturnValue('efgh');

      moduleMocker.restoreAllMocks();
      expect(child.func()).toBe('abcd');

      moduleMocker.spyOn(parent, 'func').mockReturnValue('jklm');

      expect(Object.prototype.hasOwnProperty.call(child, 'func')).toBe(false);
      expect(child.func()).toBe('jklm');
    });

    it('supports mock value returning undefined', () => {
      const obj = {
        func: () => 'some text',
      };

      moduleMocker.spyOn(obj, 'func').mockReturnValue(undefined);

      expect(obj.func()).not.toBe('some text');
    });

    it('supports mock value once returning undefined', () => {
      const obj = {
        func: () => 'some text',
      };

      moduleMocker.spyOn(obj, 'func').mockReturnValueOnce(undefined);

      expect(obj.func()).not.toBe('some text');
    });

    it('mockReturnValueOnce mocks value just once', () => {
      const fake = jest.fn(a => a + 2);
      fake.mockReturnValueOnce(42);
      expect(fake(2)).toBe(42);
      expect(fake(2)).toBe(4);
    });

    it('supports mocking resolvable async functions', () => {
      const fn = moduleMocker.fn();
      fn.mockResolvedValue('abcd');

      const promise = fn();

      expect(promise).toBeInstanceOf(mockGlobals.Promise);

      return expect(promise).resolves.toBe('abcd');
    });

    it('supports mocking resolvable async functions only once', () => {
      const fn = moduleMocker.fn();
      fn.mockResolvedValue('abcd');
      fn.mockResolvedValueOnce('abcde');

      return Promise.all([
        expect(fn()).resolves.toBe('abcde'),
        expect(fn()).resolves.toBe('abcd'),
      ]);
    });

    it('supports mocking rejectable async functions', () => {
      const err = new Error('rejected');
      const fn = moduleMocker.fn();
      fn.mockRejectedValue(err);

      const promise = fn();

      expect(promise).toBeInstanceOf(mockGlobals.Promise);

      return expect(promise).rejects.toBe(err);
    });

    it('supports mocking rejectable async functions only once', () => {
      const defaultErr = new Error('default rejected');
      const err = new Error('rejected');
      const fn = moduleMocker.fn();
      fn.mockRejectedValue(defaultErr);
      fn.mockRejectedValueOnce(err);

      return Promise.all([
        expect(fn()).rejects.toBe(err),
        expect(fn()).rejects.toBe(defaultErr),
      ]);
    });

    describe('return values', () => {
      it('tracks return values', () => {
        const fn = moduleMocker.fn(x => x * 2);

        expect(fn.mock.results).toEqual([]);

        fn(1);
        fn(2);

        expect(fn.mock.results).toEqual([
          {
            type: 'return',
            value: 2,
          },
          {
            type: 'return',
            value: 4,
          },
        ]);
      });

      it('tracks mocked return values', () => {
        const fn = moduleMocker.fn(x => x * 2);
        fn.mockReturnValueOnce('MOCKED!');

        fn(1);
        fn(2);

        expect(fn.mock.results).toEqual([
          {
            type: 'return',
            value: 'MOCKED!',
          },
          {
            type: 'return',
            value: 4,
          },
        ]);
      });

      it('supports resetting return values', () => {
        const fn = moduleMocker.fn(x => x * 2);

        expect(fn.mock.results).toEqual([]);

        fn(1);
        fn(2);

        expect(fn.mock.results).toEqual([
          {
            type: 'return',
            value: 2,
          },
          {
            type: 'return',
            value: 4,
          },
        ]);

        fn.mockReset();

        expect(fn.mock.results).toEqual([]);
      });
    });

    it('tracks thrown errors without interfering with other tracking', () => {
      const error = new Error('ODD!');
      const fn = moduleMocker.fn((x, y) => {
        // multiply params
        const result = x * y;

        if (result % 2 === 1) {
          // throw error if result is odd
          throw error;
        } else {
          return result;
        }
      });

      expect(fn(2, 4)).toBe(8);

      // Mock still throws the error even though it was internally
      // caught and recorded
      expect(() => {
        fn(3, 5);
      }).toThrow('ODD!');

      expect(fn(6, 3)).toBe(18);

      // All call args tracked
      expect(fn.mock.calls).toEqual([
        [2, 4],
        [3, 5],
        [6, 3],
      ]);
      // Results are tracked
      expect(fn.mock.results).toEqual([
        {
          type: 'return',
          value: 8,
        },
        {
          type: 'throw',
          value: error,
        },
        {
          type: 'return',
          value: 18,
        },
      ]);
    });

    it('a call that throws undefined is tracked properly', () => {
      const fn = moduleMocker.fn(() => {
        // eslint-disable-next-line no-throw-literal
        throw undefined;
      });

      try {
        fn(2, 4);
      } catch {
        // ignore error
      }

      // All call args tracked
      expect(fn.mock.calls).toEqual([[2, 4]]);
      // Results are tracked
      expect(fn.mock.results).toEqual([
        {
          type: 'throw',
          value: undefined,
        },
      ]);
    });

    it('results of recursive calls are tracked properly', () => {
      // sums up all integers from 0 -> value, using recursion
      const fn = moduleMocker.fn(value => {
        if (value === 0) {
          return 0;
        } else {
          return value + fn(value - 1);
        }
      });

      fn(4);

      // All call args tracked
      expect(fn.mock.calls).toEqual([[4], [3], [2], [1], [0]]);
      // Results are tracked
      // (in correct order of calls, rather than order of returns)
      expect(fn.mock.results).toEqual([
        {
          type: 'return',
          value: 10,
        },
        {
          type: 'return',
          value: 6,
        },
        {
          type: 'return',
          value: 3,
        },
        {
          type: 'return',
          value: 1,
        },
        {
          type: 'return',
          value: 0,
        },
      ]);
    });

    it('test results of recursive calls from within the recursive call', () => {
      // sums up all integers from 0 -> value, using recursion
      const fn = moduleMocker.fn(value => {
        if (value === 0) {
          return 0;
        } else {
          const recursiveResult = fn(value - 1);

          if (value === 3) {
            // All recursive calls have been made at this point.
            expect(fn.mock.calls).toEqual([[4], [3], [2], [1], [0]]);
            // But only the last 3 calls have returned at this point.
            expect(fn.mock.results).toEqual([
              {
                type: 'incomplete',
                value: undefined,
              },
              {
                type: 'incomplete',
                value: undefined,
              },
              {
                type: 'return',
                value: 3,
              },
              {
                type: 'return',
                value: 1,
              },
              {
                type: 'return',
                value: 0,
              },
            ]);
          }

          return value + recursiveResult;
        }
      });

      fn(4);
    });

    it('call mockClear inside recursive mock', () => {
      // sums up all integers from 0 -> value, using recursion
      const fn = moduleMocker.fn(value => {
        if (value === 3) {
          fn.mockClear();
        }

        if (value === 0) {
          return 0;
        } else {
          return value + fn(value - 1);
        }
      });

      fn(3);

      // All call args (after the call that cleared the mock) are tracked
      expect(fn.mock.calls).toEqual([[2], [1], [0]]);
      // Results (after the call that cleared the mock) are tracked
      expect(fn.mock.results).toEqual([
        {
          type: 'return',
          value: 3,
        },
        {
          type: 'return',
          value: 1,
        },
        {
          type: 'return',
          value: 0,
        },
      ]);
    });

    describe('invocationCallOrder', () => {
      it('tracks invocationCallOrder made by mocks', () => {
        const fn1 = moduleMocker.fn();
        expect(fn1.mock.invocationCallOrder).toEqual([]);

        fn1(1, 2, 3);
        expect(fn1.mock.invocationCallOrder[0]).toBe(1);

        fn1('a', 'b', 'c');
        expect(fn1.mock.invocationCallOrder[1]).toBe(2);

        fn1(1, 2, 3);
        expect(fn1.mock.invocationCallOrder[2]).toBe(3);

        const fn2 = moduleMocker.fn();
        expect(fn2.mock.invocationCallOrder).toEqual([]);

        fn2('d', 'e', 'f');
        expect(fn2.mock.invocationCallOrder[0]).toBe(4);

        fn2(4, 5, 6);
        expect(fn2.mock.invocationCallOrder[1]).toBe(5);
      });

      it('supports clearing mock invocationCallOrder', () => {
        const fn = moduleMocker.fn();
        expect(fn.mock.invocationCallOrder).toEqual([]);

        fn(1, 2, 3);
        expect(fn.mock.invocationCallOrder).toEqual([1]);

        fn.mockReturnValue('abcd');

        fn.mockClear();
        expect(fn.mock.invocationCallOrder).toEqual([]);

        fn('a', 'b', 'c');
        expect(fn.mock.invocationCallOrder).toEqual([2]);

        expect(fn()).toBe('abcd');
      });

      it('supports clearing all mocks invocationCallOrder', () => {
        const fn1 = moduleMocker.fn();
        fn1.mockImplementation(() => 'abcd');

        fn1(1, 2, 3);
        expect(fn1.mock.invocationCallOrder).toEqual([1]);

        const fn2 = moduleMocker.fn();

        fn2.mockReturnValue('abcde');
        fn2('a', 'b', 'c', 'd');
        expect(fn2.mock.invocationCallOrder).toEqual([2]);

        moduleMocker.clearAllMocks();
        expect(fn1.mock.invocationCallOrder).toEqual([]);
        expect(fn2.mock.invocationCallOrder).toEqual([]);
        expect(fn1()).toBe('abcd');
        expect(fn2()).toBe('abcde');
      });

      it('handles a property called `prototype`', () => {
        const mock = moduleMocker.generateFromMetadata(
          moduleMocker.getMetadata({prototype: 1}),
        );

        expect(mock.prototype).toBe(1);
      });
    });
  });

  describe('getMockImplementation', () => {
    it('should mock calls to a mock function', () => {
      const mockFn = moduleMocker.fn();

      mockFn.mockImplementation(() => 'Foo');

      expect(typeof mockFn.getMockImplementation()).toBe('function');
      expect(mockFn.getMockImplementation()()).toBe('Foo');
    });
  });

  describe('mockImplementationOnce', () => {
    it('should mock constructor', () => {
      const mock1 = jest.fn();
      const mock2 = jest.fn();
      const Module = jest.fn(() => ({someFn: mock1}));
      const testFn = function () {
        const m = new Module();
        m.someFn();
      };

      Module.mockImplementationOnce(() => ({someFn: mock2}));

      testFn();
      expect(mock2).toHaveBeenCalled();
      expect(mock1).not.toHaveBeenCalled();
      testFn();
      expect(mock1).toHaveBeenCalled();
    });

    it('should mock single call to a mock function', () => {
      const mockFn = moduleMocker.fn();

      mockFn
        .mockImplementationOnce(() => 'Foo')
        .mockImplementationOnce(() => 'Bar');

      expect(mockFn()).toBe('Foo');
      expect(mockFn()).toBe('Bar');
      expect(mockFn()).toBeUndefined();
    });

    it('should fallback to default mock function when no specific mock is available', () => {
      const mockFn = moduleMocker.fn();

      mockFn
        .mockImplementationOnce(() => 'Foo')
        .mockImplementationOnce(() => 'Bar')
        .mockImplementation(() => 'Default');

      expect(mockFn()).toBe('Foo');
      expect(mockFn()).toBe('Bar');
      expect(mockFn()).toBe('Default');
      expect(mockFn()).toBe('Default');
    });
  });

  describe('withImplementation', () => {
    it('sets an implementation which is available within the callback', () => {
      const mock1 = jest.fn();
      const mock2 = jest.fn();

      const Module = jest.fn(() => ({someFn: mock1}));
      const testFn = function () {
        const m = new Module();
        m.someFn();
      };

      Module.withImplementation(
        () => ({someFn: mock2}),
        () => {
          testFn();
          expect(mock2).toHaveBeenCalled();
          expect(mock1).not.toHaveBeenCalled();
        },
      );

      testFn();
      expect(mock1).toHaveBeenCalled();

      expect.assertions(3);
    });

    it('returns a promise if the provided callback is asynchronous', async () => {
      const mock1 = jest.fn();
      const mock2 = jest.fn();

      const Module = jest.fn(() => ({someFn: mock1}));
      const testFn = function () {
        const m = new Module();
        m.someFn();
      };

      const promise = Module.withImplementation(
        () => ({someFn: mock2}),
        async () => {
          testFn();
          expect(mock2).toHaveBeenCalled();
          expect(mock1).not.toHaveBeenCalled();
        },
      );

      expect(util.types.isPromise(promise)).toBe(true);

      await promise;

      testFn();
      expect(mock1).toHaveBeenCalled();

      expect.assertions(4);
    });

    it('mockImplementationOnce does not bleed into withImplementation', () => {
      const mock = jest
        .fn(() => 'outside callback')
        .mockImplementationOnce(() => 'once');

      mock.withImplementation(
        () => 'inside callback',
        () => {
          expect(mock()).toBe('inside callback');
        },
      );

      expect(mock()).toBe('once');
      expect(mock()).toBe('outside callback');
    });

    it('mockReturnValueOnce does not bleed into withImplementation', () => {
      const mock = jest
        .fn(() => 'outside callback')
        .mockReturnValueOnce('once');

      mock.withImplementation(
        () => 'inside callback',
        () => {
          expect(mock()).toBe('inside callback');
        },
      );

      expect(mock()).toBe('once');
      expect(mock()).toBe('outside callback');
    });
  });

  test('mockReturnValue does not override mockImplementationOnce', () => {
    const mockFn = jest
      .fn()
      .mockReturnValue(1)
      .mockImplementationOnce(() => 2);
    expect(mockFn()).toBe(2);
    expect(mockFn()).toBe(1);
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

  test('default mockName is jest.fn()', () => {
    const fn = jest.fn();
    expect(fn.getMockName()).toBe('jest.fn()');
  });

  test('mockName sets the mock name', () => {
    const fn = jest.fn();
    fn.mockName('myMockFn');
    expect(fn.getMockName()).toBe('myMockFn');
  });

  test('jest.fn should provide the correct lastCall', () => {
    const mock = jest.fn();

    expect(mock.mock).not.toHaveProperty('lastCall');

    mock('first');
    mock('second');
    mock('last', 'call');

    expect(mock).toHaveBeenLastCalledWith('last', 'call');
    expect(mock.mock.lastCall).toEqual(['last', 'call']);
  });

  test('lastCall gets reset by mockReset', () => {
    const mock = jest.fn();

    mock('first');
    mock('last', 'call');

    expect(mock.mock.lastCall).toEqual(['last', 'call']);

    mock.mockReset();

    expect(mock.mock).not.toHaveProperty('lastCall');
  });

  test('mockName gets reset by mockReset', () => {
    const fn = jest.fn();
    expect(fn.getMockName()).toBe('jest.fn()');
    fn.mockName('myMockFn');
    expect(fn.getMockName()).toBe('myMockFn');
    fn.mockReset();
    expect(fn.getMockName()).toBe('jest.fn()');
  });

  test('mockName gets reset by mockRestore', () => {
    const fn = jest.fn();
    expect(fn.getMockName()).toBe('jest.fn()');
    fn.mockName('myMockFn');
    expect(fn.getMockName()).toBe('myMockFn');
    fn.mockRestore();
    expect(fn.getMockName()).toBe('jest.fn()');
  });

  test('mockName is not reset by mockClear', () => {
    const fn = jest.fn(() => false);
    fn.mockName('myMockFn');
    expect(fn.getMockName()).toBe('myMockFn');
    fn.mockClear();
    expect(fn.getMockName()).toBe('myMockFn');
  });

  describe('spyOn', () => {
    it('should work', () => {
      let isOriginalCalled = false;
      let originalCallThis;
      let originalCallArguments;
      const obj = {
        method() {
          isOriginalCalled = true;
          // eslint-disable-next-line @typescript-eslint/no-this-alias
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
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).toHaveBeenCalled();

      isOriginalCalled = false;
      originalCallThis = null;
      originalCallArguments = null;
      spy.mockRestore();
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).not.toHaveBeenCalled();
    });

    describe('should throw', () => {
      it.each`
        value         | type
        ${'foo'}      | ${'string'}
        ${1}          | ${'number'}
        ${Number.NaN} | ${'number'}
        ${1n}         | ${'bigint'}
        ${Symbol()}   | ${'symbol'}
        ${true}       | ${'boolean'}
        ${false}      | ${'boolean'}
        ${undefined}  | ${'undefined'}
        ${null}       | ${'null'}
      `(
        'when primitive value $value is provided instead of an object',
        ({value, type}) => {
          expect(() => {
            moduleMocker.spyOn(value, 'method');
          }).toThrow(`Cannot use spyOn on a primitive value; ${type} given`);
        },
      );

      it('when property name is not provided', () => {
        expect(() => {
          moduleMocker.spyOn({}, null);
        }).toThrow('No property name supplied');
      });

      it('when property does not exist', () => {
        expect(() => {
          moduleMocker.spyOn({}, 'doesNotExist');
        }).toThrow(
          'Property `doesNotExist` does not exist in the provided object',
        );
      });

      it('when getter does not exist', () => {
        expect(() => {
          moduleMocker.spyOn({}, 'missingGet', 'get');
        }).toThrow(
          'Property `missingGet` does not exist in the provided object',
        );
      });

      it('when setter does not exist', () => {
        expect(() => {
          moduleMocker.spyOn({}, 'missingSet', 'set');
        }).toThrow(
          'Property `missingSet` does not exist in the provided object',
        );
      });

      it('when getter is not configurable', () => {
        expect(() => {
          const obj = {};

          Object.defineProperty(obj, 'property', {
            configurable: false,
            get() {
              return 1;
            },
          });

          moduleMocker.spyOn(obj, 'property', 'get');
        }).toThrow('Property `property` is not declared configurable');
      });

      it('when setter is not configurable', () => {
        expect(() => {
          const obj = {};
          let value = 38;

          Object.defineProperty(obj, 'property', {
            configurable: false,
            get() {
              return value;
            },
            set(newValue) {
              value = newValue;
            },
          });

          moduleMocker.spyOn(obj, 'property', 'set');
        }).toThrow('Property `property` is not declared configurable');
      });

      it('when property does not have access type get', () => {
        expect(() => {
          const obj = {};
          let value = 38;

          // eslint-disable-next-line accessor-pairs
          Object.defineProperty(obj, 'property', {
            configurable: true,
            set(newValue) {
              value = newValue;
            },
          });

          moduleMocker.spyOn(obj, 'property', 'get');
        }).toThrow('Property `property` does not have access type get');
      });

      it('when property does not have access type set', () => {
        expect(() => {
          const obj = {};

          Object.defineProperty(obj, 'property', {
            configurable: true,
            get() {
              return 1;
            },
          });

          moduleMocker.spyOn(obj, 'property', 'set');
        }).toThrow('Property `property` does not have access type set');
      });

      it('when trying to spy on a non function property', () => {
        expect(() => {
          moduleMocker.spyOn({property: 123}, 'property');
        }).toThrow(
          "Cannot spy on the `property` property because it is not a function; number given instead. If you are trying to mock a property, use `jest.replaceProperty(object, 'property', value)` instead.",
        );
      });
    });

    it('supports spying on a method named `0`', () => {
      let haveBeenCalled = false;
      const obj = {
        0: () => {
          haveBeenCalled = true;
        },
      };

      const spy = moduleMocker.spyOn(obj, 0);
      obj[0].call(null);

      expect(haveBeenCalled).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('supports spying on a symbol-keyed method', () => {
      const k = Symbol();

      let haveBeenCalled = false;
      const obj = {
        [k]: () => {
          haveBeenCalled = true;
        },
      };

      const spy = moduleMocker.spyOn(obj, k);
      obj[k].call(null);

      expect(haveBeenCalled).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('supports spying on a method which is defined on a function', () => {
      let haveBeenCalled = false;
      const obj = () => true;

      Object.defineProperty(obj, 'method', {
        configurable: true,
        value: () => {
          haveBeenCalled = true;
        },
        writable: true,
      });

      const spy = moduleMocker.spyOn(obj, 'method');
      obj.method.call(null);

      expect(haveBeenCalled).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('supports clearing a spy', () => {
      let methodOneCalls = 0;
      const obj = {
        methodOne() {
          methodOneCalls++;
        },
      };

      const spy1 = moduleMocker.spyOn(obj, 'methodOne');

      obj.methodOne();

      // The spy and the original function are called.
      expect(methodOneCalls).toBe(1);
      expect(spy1.mock.calls).toHaveLength(1);

      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);

      spy1.mockClear();

      // After clearing the spy, the method is still mock function.
      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);

      // After clearing the spy, call count is reset.
      expect(spy1.mock.calls).toHaveLength(0);
    });

    it('supports clearing all spies', () => {
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

      obj.methodOne();
      obj.methodTwo();

      // Both spies and both original functions are called.
      expect(methodOneCalls).toBe(1);
      expect(methodTwoCalls).toBe(1);
      expect(spy1.mock.calls).toHaveLength(1);
      expect(spy2.mock.calls).toHaveLength(1);

      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);
      expect(moduleMocker.isMockFunction(obj.methodTwo)).toBe(true);

      moduleMocker.clearAllMocks();

      // After clearing all mocks, the methods are still mock functions.
      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);
      expect(moduleMocker.isMockFunction(obj.methodTwo)).toBe(true);

      // After clearing all mocks, call counts are reset.
      expect(spy1.mock.calls).toHaveLength(0);
      expect(spy2.mock.calls).toHaveLength(0);
    });

    it('supports resetting a spy', () => {
      const methodOneReturn = 10;
      let methodOneRealCalls = 0;
      const obj = {
        methodOne() {
          methodOneRealCalls++;
          return methodOneReturn;
        },
      };

      const spy1 = moduleMocker.spyOn(obj, 'methodOne').mockReturnValue(100);

      // Return value is mocked.
      expect(obj.methodOne()).toBe(100);
      // Real impl has not been used.
      expect(methodOneRealCalls).toBe(0);

      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);

      spy1.mockReset();

      // After resetting the spy, the method is still mock functions.
      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);

      // After resetting the spy, the method returns undefined.
      expect(obj.methodOne()).toBeUndefined();

      // Real implementation has still not been called.
      expect(methodOneRealCalls).toBe(0);
    });

    it('supports resetting all spies', () => {
      const methodOneReturn = 10;
      const methodTwoReturn = {};
      let methodOneRealCalls = 0;
      let methodTwoRealCalls = 0;
      const obj = {
        methodOne() {
          methodOneRealCalls++;
          return methodOneReturn;
        },
        methodTwo() {
          methodTwoRealCalls++;
          return methodTwoReturn;
        },
      };

      // methodOne is spied on and mocked.
      moduleMocker.spyOn(obj, 'methodOne').mockReturnValue(100);
      // methodTwo is spied on but not mocked.
      moduleMocker.spyOn(obj, 'methodTwo');

      // Return values are mocked.
      expect(obj.methodOne()).toBe(100);
      expect(obj.methodTwo()).toBe(methodTwoReturn);

      // The real implementation has not been called when mocked.
      expect(methodOneRealCalls).toBe(0);

      // But has for the unmocked spy.
      expect(methodTwoRealCalls).toBe(1);

      // Both are mock functions.
      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);
      expect(moduleMocker.isMockFunction(obj.methodTwo)).toBe(true);

      moduleMocker.resetAllMocks();

      // After resetting all mocks, the methods are still mock functions.
      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);
      expect(moduleMocker.isMockFunction(obj.methodTwo)).toBe(true);

      // After resetting all mocks, the methods are stubs returning undefined.
      expect(obj.methodOne()).toBeUndefined();

      // NB: It may not be desirable for reset to stub a spy that was never mocked -
      // consider changing in a future major.
      expect(obj.methodTwo()).toBeUndefined();

      // Real functions have not been called any more times.
      expect(methodOneRealCalls).toBe(0);
      expect(methodTwoRealCalls).toBe(1);
    });

    it('supports restoring a spy', () => {
      let methodOneCalls = 0;
      const obj = {
        methodOne() {
          methodOneCalls++;
        },
      };

      const spy1 = moduleMocker.spyOn(obj, 'methodOne');

      obj.methodOne();

      // The spy and the original function got called.
      expect(methodOneCalls).toBe(1);
      expect(spy1.mock.calls).toHaveLength(1);

      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(true);

      spy1.mockRestore();

      // After restoring the spy, the method is not mock function.
      expect(moduleMocker.isMockFunction(obj.methodOne)).toBe(false);

      obj.methodOne();

      // After restoring the spy only the real method bumps its call count, not the spy.
      expect(methodOneCalls).toBe(2);
      expect(spy1.mock.calls).toHaveLength(0);
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
      expect(spy1.mock.calls).toHaveLength(1);
      expect(spy2.mock.calls).toHaveLength(1);

      moduleMocker.restoreAllMocks();

      // Then, after resetting all mocks, we call methods again. Only the real
      // methods should bump their count, not the spies.
      obj.methodOne();
      obj.methodTwo();
      expect(methodOneCalls).toBe(2);
      expect(methodTwoCalls).toBe(2);
      expect(spy1.mock.calls).toHaveLength(1);
      expect(spy2.mock.calls).toHaveLength(1);
    });

    it('should work with getters', () => {
      let isOriginalCalled = false;
      let originalCallThis;
      let originalCallArguments;
      const obj = {
        get method() {
          return function () {
            isOriginalCalled = true;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            originalCallThis = this;
            originalCallArguments = arguments;
          };
        },
      };

      const spy = moduleMocker.spyOn(obj, 'method', 'get');

      const thisArg = {this: true};
      const firstArg = {first: true};
      const secondArg = {second: true};
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).toHaveBeenCalled();

      isOriginalCalled = false;
      originalCallThis = null;
      originalCallArguments = null;
      spy.mockRestore();
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should work with object of null prototype', () => {
      const Foo = Object.assign(Object.create(null), {
        foo() {},
      });

      const spy = moduleMocker.spyOn(Foo, 'foo');

      Foo.foo();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('spyOnProperty', () => {
    it('should work - getter', () => {
      let isOriginalCalled = false;
      let originalCallThis;
      let originalCallArguments;
      const obj = {
        get method() {
          return function () {
            isOriginalCalled = true;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            originalCallThis = this;
            originalCallArguments = arguments;
          };
        },
      };

      const spy = moduleMocker.spyOn(obj, 'method', 'get');

      const thisArg = {this: true};
      const firstArg = {first: true};
      const secondArg = {second: true};
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).toHaveBeenCalled();

      isOriginalCalled = false;
      originalCallThis = null;
      originalCallArguments = null;
      spy.mockRestore();
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should work - setter', () => {
      const obj = {
        _property: false,
        set property(value) {
          this._property = value;
        },
        get property() {
          return this._property;
        },
      };

      const spy = moduleMocker.spyOn(obj, 'property', 'set');
      obj.property = true;
      expect(spy).toHaveBeenCalled();
      expect(obj.property).toBe(true);
      obj.property = false;
      spy.mockRestore();
      obj.property = true;
      expect(spy).not.toHaveBeenCalled();
      expect(obj.property).toBe(true);
    });

    it('should throw on invalid input', () => {
      expect(() => {
        moduleMocker.spyOn(null, 'method');
      }).toThrow('Cannot use spyOn on a primitive value; null given');
      expect(() => {
        moduleMocker.spyOn({}, 'method');
      }).toThrow('Property `method` does not exist in the provided object');
      expect(() => {
        moduleMocker.spyOn({method: 10}, 'method');
      }).toThrow(
        "Cannot spy on the `method` property because it is not a function; number given instead. If you are trying to mock a property, use `jest.replaceProperty(object, 'method', value)` instead.",
      );
    });

    it('supports resetting a spy', () => {
      const methodOneReturn = 0;
      let methodOneRealCalls = 0;
      const obj = {
        get methodOne() {
          methodOneRealCalls++;
          return methodOneReturn;
        },
      };

      const spy1 = moduleMocker
        .spyOn(obj, 'methodOne', 'get')
        .mockReturnValue(10);

      // Return value is mocked.
      expect(obj.methodOne).toBe(10);

      spy1.mockReset();

      // After resetting the spy, the getter is a stub returning undefined
      expect(obj.methodOne).toBeUndefined();
      expect(methodOneRealCalls).toBe(0);
    });

    it('supports resetting all spies', () => {
      const methodOneReturn = 10;
      const methodTwoReturn = 20;
      const obj = {
        get methodOne() {
          return methodOneReturn;
        },
        get methodTwo() {
          return methodTwoReturn;
        },
      };

      moduleMocker.spyOn(obj, 'methodOne', 'get').mockReturnValue(100);
      moduleMocker.spyOn(obj, 'methodTwo', 'get').mockReturnValue(200);

      // Return values are mocked.
      expect(methodOneReturn).toBe(10);
      expect(methodTwoReturn).toBe(20);
      expect(obj.methodOne).toBe(100);
      expect(obj.methodTwo).toBe(200);

      moduleMocker.resetAllMocks();

      // After resetting all mocks, the methods are stubs
      expect(obj.methodOne).toBeUndefined();
      expect(obj.methodTwo).toBeUndefined();
    });

    it('supports restoring a spy', () => {
      let methodOneCalls = 0;
      const obj = {
        get methodOne() {
          return function () {
            methodOneCalls++;
          };
        },
      };

      const spy1 = moduleMocker.spyOn(obj, 'methodOne', 'get');

      obj.methodOne();

      // The spy and the original function are called.
      expect(methodOneCalls).toBe(1);
      expect(spy1.mock.calls).toHaveLength(1);

      spy1.mockRestore();

      obj.methodOne();

      // After restoring the spy only the real method bumps its call count, not the spy.
      expect(methodOneCalls).toBe(2);
      expect(spy1.mock.calls).toHaveLength(0);
    });

    it('supports restoring all spies', () => {
      let methodOneCalls = 0;
      let methodTwoCalls = 0;
      const obj = {
        get methodOne() {
          return function () {
            methodOneCalls++;
          };
        },
        get methodTwo() {
          return function () {
            methodTwoCalls++;
          };
        },
      };

      const spy1 = moduleMocker.spyOn(obj, 'methodOne', 'get');
      const spy2 = moduleMocker.spyOn(obj, 'methodTwo', 'get');

      // First, we call with the spies: both spies and both original functions
      // should be called.
      obj.methodOne();
      obj.methodTwo();
      expect(methodOneCalls).toBe(1);
      expect(methodTwoCalls).toBe(1);
      expect(spy1.mock.calls).toHaveLength(1);
      expect(spy2.mock.calls).toHaveLength(1);

      moduleMocker.restoreAllMocks();

      // Then, after resetting all mocks, we call methods again. Only the real
      // methods should bump their count, not the spies.
      obj.methodOne();
      obj.methodTwo();
      expect(methodOneCalls).toBe(2);
      expect(methodTwoCalls).toBe(2);
      expect(spy1.mock.calls).toHaveLength(1);
      expect(spy2.mock.calls).toHaveLength(1);
    });

    it('should work with getters on the prototype chain', () => {
      let isOriginalCalled = false;
      let originalCallThis;
      let originalCallArguments;
      const prototype = {
        get method() {
          return function () {
            isOriginalCalled = true;
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            originalCallThis = this;
            originalCallArguments = arguments;
          };
        },
      };
      const obj = Object.create(prototype, {});

      const spy = moduleMocker.spyOn(obj, 'method', 'get');

      const thisArg = {this: true};
      const firstArg = {first: true};
      const secondArg = {second: true};
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).toHaveBeenCalled();

      isOriginalCalled = false;
      originalCallThis = null;
      originalCallArguments = null;
      spy.mockRestore();
      obj.method.call(thisArg, firstArg, secondArg);
      expect(isOriginalCalled).toBe(true);
      expect(originalCallThis).toBe(thisArg);
      expect(originalCallArguments).toHaveLength(2);
      expect(originalCallArguments[0]).toBe(firstArg);
      expect(originalCallArguments[1]).toBe(secondArg);
      expect(spy).not.toHaveBeenCalled();
    });

    test('should work with setters on the prototype chain', () => {
      const prototype = {
        _property: false,
        set property(value) {
          this._property = value;
        },
        get property() {
          return this._property;
        },
      };
      const obj = Object.create(prototype, {});

      const spy = moduleMocker.spyOn(obj, 'property', 'set');
      obj.property = true;
      expect(spy).toHaveBeenCalled();
      expect(obj.property).toBe(true);
      obj.property = false;
      spy.mockRestore();
      obj.property = true;
      expect(spy).not.toHaveBeenCalled();
      expect(obj.property).toBe(true);
    });

    it('supports resetting a spy on the prototype chain', () => {
      let methodOneRealCalls = 0;
      const prototype = {
        get methodOne() {
          methodOneRealCalls++;
          return 1;
        },
      };
      const obj = Object.create(prototype, {});

      const spy1 = moduleMocker
        .spyOn(obj, 'methodOne', 'get')
        .mockReturnValue(10);

      // Return value is mocked.
      expect(obj.methodOne).toBe(10);

      spy1.mockReset();

      // After resetting the spy, the method is a stub.
      expect(obj.methodOne).toBeUndefined();

      // The real implementation has not been used.
      expect(methodOneRealCalls).toBe(0);
    });

    it('supports resetting all spies on the prototype chain', () => {
      const methodOneReturn = 10;
      const methodTwoReturn = 20;
      const prototype = {
        get methodOne() {
          return methodOneReturn;
        },
        get methodTwo() {
          return methodTwoReturn;
        },
      };
      const obj = Object.create(prototype, {});

      moduleMocker.spyOn(obj, 'methodOne', 'get').mockReturnValue(100);
      moduleMocker.spyOn(obj, 'methodTwo', 'get').mockReturnValue(200);

      // Return values are mocked.
      expect(obj.methodOne).toBe(100);
      expect(obj.methodTwo).toBe(200);

      moduleMocker.resetAllMocks();

      // After resetting all mocks, the methods are stubs
      expect(obj.methodOne).toBeUndefined();
      expect(obj.methodTwo).toBeUndefined();
    });

    it('supports restoring a spy on the prototype chain', () => {
      let methodOneCalls = 0;
      const prototype = {
        get methodOne() {
          return function () {
            methodOneCalls++;
          };
        },
      };
      const obj = Object.create(prototype, {});

      const spy1 = moduleMocker.spyOn(obj, 'methodOne', 'get');

      obj.methodOne();

      // The spy and the original function are called, because we have not mocked it.
      expect(methodOneCalls).toBe(1);
      expect(spy1.mock.calls).toHaveLength(1);

      spy1.mockRestore();

      obj.methodOne();

      // After restoring the spy only the real method bumps its call count, not the spy.
      expect(methodOneCalls).toBe(2);
      expect(spy1.mock.calls).toHaveLength(0);
    });

    it('supports restoring all spies on the prototype chain', () => {
      let methodOneCalls = 0;
      let methodTwoCalls = 0;
      const prototype = {
        get methodOne() {
          return function () {
            methodOneCalls++;
          };
        },
        get methodTwo() {
          return function () {
            methodTwoCalls++;
          };
        },
      };
      const obj = Object.create(prototype, {});

      const spy1 = moduleMocker.spyOn(obj, 'methodOne', 'get');
      const spy2 = moduleMocker.spyOn(obj, 'methodTwo', 'get');

      // First, we call with the spies: both spies and both original functions
      // should be called.
      obj.methodOne();
      obj.methodTwo();
      expect(methodOneCalls).toBe(1);
      expect(methodTwoCalls).toBe(1);
      expect(spy1.mock.calls).toHaveLength(1);
      expect(spy2.mock.calls).toHaveLength(1);

      moduleMocker.restoreAllMocks();

      // Then, after resetting all mocks, we call methods again. Only the real
      // methods should bump their count, not the spies.
      obj.methodOne();
      obj.methodTwo();
      expect(methodOneCalls).toBe(2);
      expect(methodTwoCalls).toBe(2);
      expect(spy1.mock.calls).toHaveLength(1);
      expect(spy2.mock.calls).toHaveLength(1);
    });
  });

  describe('replaceProperty', () => {
    it('should work', () => {
      const obj = {
        property: 1,
      };

      const replaced = moduleMocker.replaceProperty(obj, 'property', 2);

      expect(obj.property).toBe(2);

      replaced.restore();

      expect(obj.property).toBe(1);
    });

    it('should allow mocking a property multiple times', () => {
      const obj = {
        property: 1,
      };

      const replacedFirst = moduleMocker.replaceProperty(obj, 'property', 2);

      const replacedSecond = moduleMocker.replaceProperty(obj, 'property', 3);

      expect(obj.property).toBe(3);

      replacedSecond.restore();

      expect(obj.property).toBe(1);

      replacedFirst.restore();

      expect(obj.property).toBe(1);
    });

    it('should allow mocking with value of different value', () => {
      const obj = {
        property: 1,
      };

      const replaced = moduleMocker.replaceProperty(obj, 'property', {
        foo: 'bar',
      });

      expect(obj.property).toStrictEqual({foo: 'bar'});

      replaced.restore();

      expect(obj.property).toBe(1);
    });

    describe('should throw', () => {
      it.each`
        value         | type
        ${'foo'}      | ${'string'}
        ${1}          | ${'number'}
        ${Number.NaN} | ${'number'}
        ${1n}         | ${'bigint'}
        ${Symbol()}   | ${'symbol'}
        ${true}       | ${'boolean'}
        ${false}      | ${'boolean'}
        ${undefined}  | ${'undefined'}
        ${null}       | ${'null'}
      `(
        'when primitive value $value is provided instead of an object',
        ({value, type}) => {
          expect(() => {
            moduleMocker.replaceProperty(value, 'property', 1);
          }).toThrow(
            `Cannot use replaceProperty on a primitive value; ${type} given`,
          );
        },
      );

      it('when property name is not provided', () => {
        expect(() => {
          moduleMocker.replaceProperty({}, null, 1);
        }).toThrow('No property name supplied');
      });

      it('when property does not exist', () => {
        expect(() => {
          moduleMocker.replaceProperty({}, 'doesNotExist', 1);
        }).toThrow(
          'Property `doesNotExist` does not exist in the provided object',
        );
      });

      it('when property is not configurable', () => {
        expect(() => {
          const obj = {};

          Object.defineProperty(obj, 'property', {
            configurable: false,
            value: 1,
            writable: false,
          });

          moduleMocker.replaceProperty(obj, 'property', 2);
        }).toThrow('Property `property` is not declared configurable');
      });

      it('when trying to replace a method', () => {
        expect(() => {
          moduleMocker.replaceProperty({method: () => {}}, 'method', () => {});
        }).toThrow(
          "Cannot replace the `method` property because it is a function. Use `jest.spyOn(object, 'method')` instead.",
        );
      });

      it('when trying to replace a getter', () => {
        const obj = {
          get getter() {
            return 1;
          },
        };

        expect(() => {
          moduleMocker.replaceProperty(obj, 'getter', 1);
        }).toThrow(
          'Cannot replace the `getter` property because it has a getter',
        );
      });

      it('when trying to replace a setter', () => {
        const obj = {
          // eslint-disable-next-line accessor-pairs
          set setter(_value: number) {},
        };

        expect(() => {
          moduleMocker.replaceProperty(obj, 'setter', 1);
        }).toThrow(
          'Cannot replace the `setter` property because it has a setter',
        );
      });
    });

    it('supports replacing a property named `0`', () => {
      const obj = {
        0: 'zero',
      };

      moduleMocker.replaceProperty(obj, 0, 'null');

      expect(obj[0]).toBe('null');
    });

    it('supports replacing a symbol-keyed property', () => {
      const k = Symbol();

      const obj = {
        [k]: 'zero',
      };

      moduleMocker.replaceProperty(obj, k, 'null');

      expect(obj[k]).toBe('null');
    });

    it('supports replacing a property which is defined on a function', () => {
      const obj = () => true;

      Object.defineProperty(obj, 'property', {
        configurable: true,
        value: 'abc',
        writable: true,
      });

      moduleMocker.replaceProperty(obj, 'property', 'def');

      expect(obj.property).toBe('def');
    });

    it('should work for property from prototype chain', () => {
      const parent = {property: 'abcd'};
      const child = Object.create(parent);

      const replaced = moduleMocker.replaceProperty(child, 'property', 'defg');

      expect(child.property).toBe('defg');

      replaced.restore();

      expect(child.property).toBe('abcd');
      expect(
        Object.getOwnPropertyDescriptor(child, 'property'),
      ).toBeUndefined();
    });

    describe('with restoreAllMocks', () => {
      it('should work', () => {
        const obj = {
          property: 1,
        };

        const replaced = moduleMocker.replaceProperty(obj, 'property', 2);

        expect(obj.property).toBe(2);

        moduleMocker.restoreAllMocks();

        expect(obj.property).toBe(1);

        // Just make sure that this call won't break anything while calling after the property has been already restored
        replaced.restore();

        expect(obj.property).toBe(1);
      });

      it('should work for property mocked multiple times', () => {
        const obj = {
          property: 1,
        };

        const replaced1 = moduleMocker.replaceProperty(obj, 'property', 2);
        const replaced2 = moduleMocker.replaceProperty(obj, 'property', 3);

        expect(obj.property).toBe(3);

        moduleMocker.restoreAllMocks();

        expect(obj.property).toBe(1);

        // Just make sure that this call won't break anything while calling after the property has been already restored
        replaced2.restore();
        replaced1.restore();

        expect(obj.property).toBe(1);
      });
    });

    describe('replaceValue', () => {
      it('should work', () => {
        const obj = {
          property: 1,
        };

        const replaced = moduleMocker.replaceProperty(obj, 'property', 2);

        const result = replaced.replaceValue(3);

        expect(obj.property).toBe(3);
        expect(result).toBe(replaced);
      });

      it('should work while passing different type', () => {
        const obj = {
          property: 1,
        };

        const replaced = moduleMocker.replaceProperty(obj, 'property', 2);

        const result = replaced.replaceValue('foo');

        expect(obj.property).toBe('foo');
        expect(result).toBe(replaced);
      });
    });
  });
});

describe('mocked', () => {
  it('should return unmodified input', () => {
    const subject = {};
    expect(mocked(subject)).toBe(subject);
  });
});

test('`fn` and `spyOn` do not throw', () => {
  expect(() => {
    fn();
    spyOn({apple: () => {}}, 'apple');
  }).not.toThrow();
});
