/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// <reference lib="dom" />

import {describe, expect, test} from 'tstyche';
import {
  type Mock,
  type Replaced,
  type SpiedClass,
  type SpiedFunction,
  type SpiedGetter,
  type SpiedSetter,
  fn,
  replaceProperty,
  spyOn,
} from 'jest-mock';

describe('jest.fn()', () => {
  const mockFnImpl: (this: Date, a: string, b?: number) => boolean = (a, b) =>
    true;

  const mockFn = fn(mockFnImpl);
  const mockAsyncFn = fn(async (p: boolean) => 'value');

  const MockObject = fn((credentials: string) => ({
    connect() {
      return fn();
    },
    disconnect() {
      return;
    },
  }));

  test('when sync function is provided, returned object can be chained', () => {
    expect(
      fn(() => 'value')
        .mockClear()
        .mockReset()
        .mockImplementation(() => 'value')
        .mockImplementationOnce(() => 'value')
        .mockName('mock')
        .mockReturnThis()
        .mockReturnValue('value')
        .mockReturnValueOnce('value'),
    ).type.toBe<Mock<() => string>>();

    expect(
      fn(() => 'value').mockReturnValue(Promise.resolve('value')),
    ).type.toRaiseError();
    expect(
      fn(() => 'value').mockReturnValueOnce(Promise.resolve('value')),
    ).type.toRaiseError();
  });

  test('when async function is provided, returned object can be chained', () => {
    expect(
      fn(async () => 'value')
        .mockClear()
        .mockReset()
        .mockImplementation(fn(async () => 'value'))
        .mockImplementationOnce(fn(async () => 'value'))
        .mockName('mock')
        .mockResolvedValue('value')
        .mockResolvedValueOnce('value')
        .mockRejectedValue('error')
        .mockRejectedValueOnce('error')
        .mockReturnThis()
        .mockReturnValue(Promise.resolve('value'))
        .mockReturnValueOnce(Promise.resolve('value')),
    ).type.toBe<Mock<() => Promise<string>>>();

    expect(fn(() => 'value').mockResolvedValue('value')).type.toRaiseError();
    expect(
      fn(() => 'value').mockResolvedValueOnce('value'),
    ).type.toRaiseError();

    expect(fn(() => 'value').mockRejectedValue('error')).type.toRaiseError();
    expect(
      fn(() => 'value').mockRejectedValueOnce('error'),
    ).type.toRaiseError();
  });

  test('models typings of mocked function', () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    expect(fn()).type.toMatch<Function>();

    expect(fn()).type.toBe<Mock<(...args: Array<unknown>) => unknown>>();
    expect(fn(() => {})).type.toBe<Mock<() => void>>();
    expect(fn((a: string, b?: number) => true)).type.toBe<
      Mock<(a: string, b?: number | undefined) => boolean>
    >();
    expect(
      fn((e: any) => {
        throw new Error();
      }),
    ).type.toBe<Mock<(e: any) => never>>();

    expect(fn('moduleName')).type.toRaiseError();
  });

  test('infers argument and return types of mocked function', () => {
    expect(mockFn('one', 2)).type.toBeBoolean();
    expect(mockAsyncFn(false)).type.toBe<Promise<string>>();

    expect(mockFn()).type.toRaiseError();
    expect(mockAsyncFn()).type.toRaiseError();
  });

  test('infers argument and return types of mocked object', () => {
    expect(new MockObject('credentials')).type.toBe<{
      connect(): Mock<(...args: Array<unknown>) => unknown>;
      disconnect(): void;
    }>();

    expect(new MockObject()).type.toRaiseError();
  });

  test('.getMockImplementation()', () => {
    expect(mockFn.getMockImplementation()).type.toBe<
      ((a: string, b?: number | undefined) => boolean) | undefined
    >();

    expect(mockFn.getMockImplementation('some-mock')).type.toRaiseError();
  });

  test('.getMockName()', () => {
    expect(mockFn.getMockName()).type.toBeString();

    expect(mockFn.getMockName('some-mock')).type.toRaiseError();
  });

  test('.mock', () => {
    expect(mockFn.mock.calls.length).type.toBeNumber();

    expect(mockFn.mock.calls[0][0]).type.toBeString();
    expect(mockFn.mock.calls[0][1]).type.toBe<number | undefined>();

    expect(mockFn.mock.calls[1][0]).type.toBeString();
    expect(mockFn.mock.calls[1][1]).type.toBe<number | undefined>();

    expect(mockFn.mock.contexts).type.toBe<Array<Date>>();

    expect(mockFn.mock.lastCall).type.toBe<
      [a: string, b?: number | undefined] | undefined
    >();

    expect(mockFn.mock.invocationCallOrder).type.toBe<Array<number>>();

    expect(MockObject.mock.instances).type.toBe<
      Array<{
        connect(): Mock<(...args: Array<unknown>) => unknown>;
        disconnect(): void;
      }>
    >();

    const returnValue = mockFn.mock.results[0];

    expect(returnValue.type).type.toBe<'incomplete' | 'return' | 'throw'>();
    expect(returnValue.value).type.toBeUnknown();

    if (returnValue.type === 'incomplete') {
      expect(returnValue.value).type.toBeUndefined();
    }

    if (returnValue.type === 'return') {
      expect(returnValue.value).type.toBeBoolean();
    }

    if (returnValue.type === 'throw') {
      expect(returnValue.value).type.toBeUnknown();
    }
  });

  test('.mockClear()', () => {
    expect(mockFn.mockClear()).type.toBe<
      Mock<(a: string, b?: number | undefined) => boolean>
    >();

    expect(mockFn.mockClear('some-mock')).type.toRaiseError();
  });

  test('.mockReset()', () => {
    expect(mockFn.mockReset()).type.toBe<
      Mock<(a: string, b?: number | undefined) => boolean>
    >();

    expect(mockFn.mockReset('some-mock')).type.toRaiseError();
  });

  test('.mockRestore()', () => {
    expect(mockFn.mockRestore()).type.toBeVoid();

    expect(mockFn.mockRestore('some-mock')).type.toRaiseError();
  });

  test('.mockImplementation()', () => {
    expect(
      mockFn.mockImplementation((a, b) => {
        expect(a).type.toBeString();
        expect(b).type.toBe<number | undefined>();
        return false;
      }),
    ).type.toBe<Mock<(a: string, b?: number | undefined) => boolean>>();

    expect(mockFn.mockImplementation((a: number) => false)).type.toRaiseError();
    expect(mockFn.mockImplementation(a => 'false')).type.toRaiseError();
    expect(mockFn.mockImplementation()).type.toRaiseError();

    expect(
      mockAsyncFn.mockImplementation(async a => {
        expect(a).type.toBeBoolean();
        return 'mock value';
      }),
    ).type.toBe<Mock<(p: boolean) => Promise<string>>>();

    expect(
      mockAsyncFn.mockImplementation(a => 'mock value'),
    ).type.toRaiseError();
  });

  test('.mockImplementationOnce()', () => {
    expect(
      mockFn.mockImplementationOnce((a, b) => {
        expect(a).type.toBeString();
        expect(b).type.toBe<number | undefined>();
        return false;
      }),
    ).type.toBe<Mock<(a: string, b?: number | undefined) => boolean>>();

    expect(
      mockFn.mockImplementationOnce((a: number) => false),
    ).type.toRaiseError();
    expect(mockFn.mockImplementationOnce(a => 'false')).type.toRaiseError();
    expect(mockFn.mockImplementationOnce()).type.toRaiseError();

    expect(
      mockAsyncFn.mockImplementationOnce(async a => {
        expect(a).type.toBeBoolean();
        return 'mock value';
      }),
    ).type.toBe<Mock<(p: boolean) => Promise<string>>>();
    expect(
      mockAsyncFn.mockImplementationOnce(a => 'mock value'),
    ).type.toRaiseError();
  });

  test('.mockName()', () => {
    expect(mockFn.mockName('mockedFunction')).type.toBe<
      Mock<(a: string, b?: number | undefined) => boolean>
    >();

    expect(mockFn.mockName(123)).type.toRaiseError();
    expect(mockFn.mockName()).type.toRaiseError();
  });

  test('.mockReturnThis()', () => {
    expect(mockFn.mockReturnThis()).type.toBe<
      Mock<(a: string, b?: number | undefined) => boolean>
    >();

    expect(mockFn.mockReturnThis('this')).type.toRaiseError();
  });

  test('.mockReturnValue()', () => {
    expect(mockFn.mockReturnValue(false)).type.toBe<
      Mock<(a: string, b?: number | undefined) => boolean>
    >();

    expect(mockFn.mockReturnValue('true')).type.toRaiseError();
    expect(mockFn.mockReturnValue()).type.toRaiseError();

    expect(
      mockAsyncFn.mockReturnValue(Promise.resolve('mock value')),
    ).type.toBe<Mock<(p: boolean) => Promise<string>>>();

    expect(
      mockAsyncFn.mockReturnValue(Promise.resolve(true)),
    ).type.toRaiseError();
  });

  test('.mockReturnValueOnce()', () => {
    expect(mockFn.mockReturnValueOnce(false)).type.toBe<
      Mock<(a: string, b?: number | undefined) => boolean>
    >();
    expect(mockFn.mockReturnValueOnce('true')).type.toRaiseError();

    expect(mockFn.mockReturnValueOnce()).type.toRaiseError();

    expect(
      mockAsyncFn.mockReturnValueOnce(Promise.resolve('mock value')),
    ).type.toBe<Mock<(p: boolean) => Promise<string>>>();

    expect(
      mockAsyncFn.mockReturnValueOnce(Promise.resolve(true)),
    ).type.toRaiseError();
  });

  test('.mockResolvedValue()', () => {
    expect(
      fn(() => Promise.resolve('')).mockResolvedValue('Mock value'),
    ).type.toBe<Mock<() => Promise<string>>>();

    expect(
      fn(() => Promise.resolve('')).mockResolvedValue(123),
    ).type.toRaiseError();
    expect(
      fn(() => Promise.resolve('')).mockResolvedValue(),
    ).type.toRaiseError();
  });

  test('.mockResolvedValueOnce()', () => {
    expect(
      fn(() => Promise.resolve('')).mockResolvedValueOnce('Mock value'),
    ).type.toBe<Mock<() => Promise<string>>>();

    expect(
      fn(() => Promise.resolve('')).mockResolvedValueOnce(123),
    ).type.toRaiseError();
    expect(
      fn(() => Promise.resolve('')).mockResolvedValueOnce(),
    ).type.toRaiseError();
  });

  test('.mockRejectedValue()', () => {
    expect(
      fn(() => Promise.resolve('')).mockRejectedValue(new Error('Mock error')),
    ).type.toBe<Mock<() => Promise<string>>>();
    expect(
      fn(() => Promise.resolve('')).mockRejectedValue('Mock error'),
    ).type.toBe<Mock<() => Promise<string>>>();

    expect(
      fn(() => Promise.resolve('')).mockRejectedValue(),
    ).type.toRaiseError();
  });

  test('.mockRejectedValueOnce()', () => {
    expect(
      fn(() => Promise.resolve('')).mockRejectedValueOnce(
        new Error('Mock error'),
      ),
    ).type.toBe<Mock<() => Promise<string>>>();
    expect(
      fn(() => Promise.resolve('')).mockRejectedValueOnce('Mock error'),
    ).type.toBe<Mock<() => Promise<string>>>();

    expect(
      fn(() => Promise.resolve('')).mockRejectedValueOnce(),
    ).type.toRaiseError();
  });

  test('.withImplementation()', () => {
    expect(mockFn.withImplementation(mockFnImpl, () => {})).type.toBeVoid();
    expect(mockFn.withImplementation(mockFnImpl, async () => {})).type.toBe<
      Promise<void>
    >();

    expect(mockFn.withImplementation(mockFnImpl)).type.toRaiseError();
  });
});

describe('jest.spyOn()', () => {
  const spiedArray = ['a', 'b'];

  const spiedFunction = () => {};

  const spiedObject = {
    _propertyB: false,

    methodA() {
      return true;
    },
    methodB(a: string, b: number) {
      return;
    },
    methodC(e: any) {
      throw new Error();
    },

    propertyA: 'abc',

    set propertyB(value) {
      this._propertyB = value;
    },
    get propertyB() {
      return this._propertyB;
    },
  };

  type IndexSpiedObject = {
    [key: string]: Record<string, any>;

    methodA(): boolean;
    methodB(a: string, b: number): void;
    methodC: (c: number) => boolean;
    methodE: (e: any) => never;

    propertyA: {a: string};
  };

  const indexSpiedObject: IndexSpiedObject = {
    methodA() {
      return true;
    },
    methodB(a: string, b: number) {
      return;
    },
    methodC(c: number) {
      return true;
    },
    methodE(e: any) {
      throw new Error();
    },

    propertyA: {a: 'abc'},
  };

  const spy = spyOn(spiedObject, 'methodA');

  test('models typings of spied object', () => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    expect(spy).type.not.toMatch<Function>();

    expect(spy()).type.toRaiseError();
    expect(new spy()).type.toRaiseError();

    expect(spyOn(spiedObject, 'methodA')).type.toBe<
      SpiedFunction<typeof spiedObject.methodA>
    >();
    expect(spyOn(spiedObject, 'methodB')).type.toBe<
      SpiedFunction<typeof spiedObject.methodB>
    >();
    expect(spyOn(spiedObject, 'methodC')).type.toBe<
      SpiedFunction<typeof spiedObject.methodC>
    >();

    expect(spyOn(spiedObject, 'propertyB', 'get')).type.toBe<
      SpiedGetter<typeof spiedObject.propertyB>
    >();
    expect(spyOn(spiedObject, 'propertyB', 'set')).type.toBe<
      SpiedSetter<typeof spiedObject.propertyB>
    >();
    expect(spyOn(spiedObject, 'propertyB')).type.toRaiseError();
    expect(spyOn(spiedObject, 'methodB', 'get')).type.toRaiseError();
    expect(spyOn(spiedObject, 'methodB', 'set')).type.toRaiseError();

    expect(spyOn(spiedObject, 'propertyA', 'get')).type.toBe<
      SpiedGetter<typeof spiedObject.propertyA>
    >();
    expect(spyOn(spiedObject, 'propertyA', 'set')).type.toBe<
      SpiedSetter<typeof spiedObject.propertyA>
    >();
    expect(spyOn(spiedObject, 'propertyA')).type.toRaiseError();

    expect(spyOn(spiedObject, 'notThere')).type.toRaiseError();
    expect(spyOn('abc', 'methodA')).type.toRaiseError();
    expect(spyOn(123, 'methodA')).type.toRaiseError();
    expect(spyOn(true, 'methodA')).type.toRaiseError();
    expect(spyOn(spiedObject)).type.toRaiseError();
    expect(spyOn()).type.toRaiseError();

    expect(
      spyOn(spiedArray as unknown as ArrayConstructor, 'isArray'),
    ).type.toBe<SpiedFunction<typeof Array.isArray>>();
    expect(spyOn(spiedArray, 'isArray')).type.toRaiseError();

    expect(
      // eslint-disable-next-line @typescript-eslint/ban-types
      spyOn(spiedFunction as unknown as Function, 'toString'),
    ).type.toBe<SpiedFunction<typeof spiedFunction.toString>>();
    expect(spyOn(spiedFunction, 'toString')).type.toRaiseError();

    expect(spyOn(globalThis, 'Date')).type.toBe<SpiedClass<typeof Date>>();
    expect(spyOn(Date, 'now')).type.toBe<SpiedFunction<typeof Date.now>>();
  });

  test('handles object with index signature', () => {
    expect(spyOn(indexSpiedObject, 'methodA')).type.toBe<
      SpiedFunction<typeof indexSpiedObject.methodA>
    >();
    expect(spyOn(indexSpiedObject, 'methodB')).type.toBe<
      SpiedFunction<typeof indexSpiedObject.methodB>
    >();
    expect(spyOn(indexSpiedObject, 'methodC')).type.toBe<
      SpiedFunction<typeof indexSpiedObject.methodC>
    >();
    expect(spyOn(indexSpiedObject, 'methodE')).type.toBe<
      SpiedFunction<typeof indexSpiedObject.methodE>
    >();

    expect(spyOn(indexSpiedObject, 'propertyA', 'get')).type.toBe<
      SpiedGetter<typeof indexSpiedObject.propertyA>
    >();
    expect(spyOn(indexSpiedObject, 'propertyA', 'set')).type.toBe<
      SpiedSetter<typeof indexSpiedObject.propertyA>
    >();
    expect(spyOn(indexSpiedObject, 'propertyA')).type.toRaiseError();

    expect(spyOn(indexSpiedObject, 'notThere')).type.toRaiseError();
  });

  test('handles interface with optional properties', () => {
    class SomeClass {
      constructor(one: string, two?: boolean) {}

      methodA() {
        return true;
      }
      methodB(a: string, b?: number) {
        return;
      }
    }

    interface OptionalInterface {
      constructorA?: (new (one: string) => SomeClass) | undefined;
      constructorB: new (one: string, two: boolean) => SomeClass;

      propertyA?: number | undefined;
      propertyB?: number;
      propertyC: number | undefined;
      propertyD: string;

      methodA?: ((a: boolean) => void) | undefined;
      methodB: (b: string) => boolean;
    }

    const optionalSpiedObject = {} as OptionalInterface;

    expect(spyOn(optionalSpiedObject, 'constructorA')).type.toBe<
      SpiedClass<NonNullable<typeof optionalSpiedObject.constructorA>>
    >();
    expect(spyOn(optionalSpiedObject, 'constructorB')).type.toBe<
      SpiedClass<typeof optionalSpiedObject.constructorB>
    >();

    expect(
      spyOn(optionalSpiedObject, 'constructorA', 'get'),
    ).type.toRaiseError();
    expect(
      spyOn(optionalSpiedObject, 'constructorA', 'set'),
    ).type.toRaiseError();

    expect(spyOn(optionalSpiedObject, 'methodA')).type.toBe<
      SpiedFunction<NonNullable<typeof optionalSpiedObject.methodA>>
    >();
    expect(spyOn(optionalSpiedObject, 'methodB')).type.toBe<
      SpiedFunction<typeof optionalSpiedObject.methodB>
    >();

    expect(spyOn(optionalSpiedObject, 'methodA', 'get')).type.toRaiseError();
    expect(spyOn(optionalSpiedObject, 'methodA', 'set')).type.toRaiseError();

    expect(spyOn(optionalSpiedObject, 'propertyA', 'get')).type.toBe<
      SpiedGetter<NonNullable<typeof optionalSpiedObject.propertyA>>
    >();
    expect(spyOn(optionalSpiedObject, 'propertyA', 'set')).type.toBe<
      SpiedSetter<NonNullable<typeof optionalSpiedObject.propertyA>>
    >();
    expect(spyOn(optionalSpiedObject, 'propertyB', 'get')).type.toBe<
      SpiedGetter<NonNullable<typeof optionalSpiedObject.propertyB>>
    >();
    expect(spyOn(optionalSpiedObject, 'propertyB', 'set')).type.toBe<
      SpiedSetter<NonNullable<typeof optionalSpiedObject.propertyB>>
    >();
    expect(spyOn(optionalSpiedObject, 'propertyC', 'get')).type.toBe<
      SpiedGetter<typeof optionalSpiedObject.propertyC>
    >();
    expect(spyOn(optionalSpiedObject, 'propertyC', 'set')).type.toBe<
      SpiedSetter<typeof optionalSpiedObject.propertyC>
    >();
    expect(spyOn(optionalSpiedObject, 'propertyD', 'get')).type.toBe<
      SpiedGetter<typeof optionalSpiedObject.propertyD>
    >();
    expect(spyOn(optionalSpiedObject, 'propertyD', 'set')).type.toBe<
      SpiedSetter<typeof optionalSpiedObject.propertyD>
    >();

    expect(spyOn(optionalSpiedObject, 'propertyA')).type.toRaiseError();
    expect(spyOn(optionalSpiedObject, 'propertyB')).type.toRaiseError();
  });

  test('handles properties of `prototype`', () => {
    expect(
      spyOn(Storage.prototype, 'setItem').mockImplementation(
        (key: string, value: string) => {},
      ),
    ).type.toBe<SpiedFunction<(key: string, value: string) => void>>();

    expect(
      spyOn(Storage.prototype, 'setItem').mockImplementation(
        (key: string, value: number) => {},
      ),
    ).type.toRaiseError();
  });
});

describe('jest.replaceProperty()', () => {
  const replaceObject = {
    method: () => {},
    property: 1,
  };

  interface ComplexObject {
    numberOrUndefined: number | undefined;
    optionalString?: string;
    multipleTypes: number | string | {foo: number} | null;
  }

  const complexObject = {} as ComplexObject;

  interface ObjectWithDynamicProperties {
    [key: string]: boolean;
  }

  const objectWithDynamicProperties = {} as ObjectWithDynamicProperties;

  test('models typings of replaced property', () => {
    expect(replaceProperty(replaceObject, 'property', 1)).type.toBe<
      Replaced<number>
    >();
    expect(replaceProperty(replaceObject, 'method', () => {})).type.toBe<
      Replaced<() => void>
    >();
    expect(
      replaceProperty(replaceObject, 'property', 1).replaceValue(1).restore(),
    ).type.toBeVoid();

    expect(replaceProperty(replaceObject, 'invalid', 1)).type.toRaiseError();
    expect(
      replaceProperty(replaceObject, 'property', 'not a number'),
    ).type.toRaiseError();

    expect(
      replaceProperty(replaceObject, 'property', 1).replaceValue(
        'not a number',
      ),
    ).type.toRaiseError();

    expect(
      replaceProperty(complexObject, 'numberOrUndefined', undefined),
    ).type.toBe<Replaced<number | undefined>>();
    expect(replaceProperty(complexObject, 'numberOrUndefined', 1)).type.toBe<
      Replaced<number | undefined>
    >();

    expect(
      replaceProperty(
        complexObject,
        'numberOrUndefined',
        'string is not valid TypeScript type',
      ),
    ).type.toRaiseError();

    expect(replaceProperty(complexObject, 'optionalString', 'foo')).type.toBe<
      Replaced<string | undefined>
    >();
    expect(
      replaceProperty(complexObject, 'optionalString', undefined),
    ).type.toBe<Replaced<string | undefined>>();

    expect(
      replaceProperty(objectWithDynamicProperties, 'dynamic prop 1', true),
    ).type.toBe<Replaced<boolean>>();
    expect(
      replaceProperty(objectWithDynamicProperties, 'dynamic prop 1', undefined),
    ).type.toRaiseError();

    expect(
      replaceProperty(complexObject, 'not a property', undefined),
    ).type.toRaiseError();

    expect(
      replaceProperty(complexObject, 'multipleTypes', 1)
        .replaceValue('foo')
        .replaceValue({foo: 1})
        .replaceValue(null),
    ).type.toBe<Replaced<ComplexObject['multipleTypes']>>();
  });
});
