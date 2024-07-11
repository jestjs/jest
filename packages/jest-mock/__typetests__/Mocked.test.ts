/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {describe, expect, test} from 'tstyche';
import type {MockInstance, Mocked} from 'jest-mock';

describe('Mocked', () => {
  test('wraps a class type with type definitions of the Jest mock function', () => {
    class SomeClass {
      constructor(one: string, two?: boolean) {}

      methodA() {
        return true;
      }
      methodB(a: string, b?: number) {
        return;
      }
    }

    const MockSomeClass = SomeClass as Mocked<typeof SomeClass>;

    expect(MockSomeClass.mock.calls[0]).type.toBe<
      [one: string, two?: boolean]
    >();

    expect(MockSomeClass.prototype.methodA.mock.calls[0]).type.toBe<[]>();
    expect(MockSomeClass.prototype.methodB.mock.calls[0]).type.toBe<
      [a: string, b?: number]
    >();

    expect(
      MockSomeClass.prototype.methodA.mockReturnValue('true'),
    ).type.toRaiseError();
    expect(
      MockSomeClass.prototype.methodB.mockImplementation(
        (a: string, b?: string) => {
          return;
        },
      ),
    ).type.toRaiseError();

    expect(MockSomeClass.mock.instances[0].methodA.mock.calls[0]).type.toBe<
      []
    >();
    expect(MockSomeClass.prototype.methodB.mock.calls[0]).type.toBe<
      [a: string, b?: number]
    >();

    const mockSomeInstance = new MockSomeClass('a') as Mocked<
      InstanceType<typeof MockSomeClass>
    >;

    expect(mockSomeInstance.methodA.mock.calls[0]).type.toBe<[]>();
    expect(mockSomeInstance.methodB.mock.calls[0]).type.toBe<
      [a: string, b?: number]
    >();

    expect(
      mockSomeInstance.methodA.mockReturnValue('true'),
    ).type.toRaiseError();
    expect(
      mockSomeInstance.methodB.mockImplementation((a: string, b?: string) => {
        return;
      }),
    ).type.toRaiseError();

    expect(new SomeClass('sample')).type.toBeAssignableWith(mockSomeInstance);
  });

  test('wraps a function type with type definitions of the Jest mock function', () => {
    function someFunction(a: string, b?: number): boolean {
      return true;
    }

    const mockFunction = someFunction as Mocked<typeof someFunction>;

    expect(mockFunction.mock.calls[0]).type.toBe<[a: string, b?: number]>();

    expect(mockFunction.mockReturnValue(123)).type.toRaiseError();
    expect(
      mockFunction.mockImplementation((a: boolean, b?: number) => true),
    ).type.toRaiseError();

    expect(someFunction).type.toBeAssignableWith(mockFunction);
  });

  test('wraps an async function type with type definitions of the Jest mock function', () => {
    async function someAsyncFunction(a: Array<boolean>): Promise<string> {
      return 'true';
    }

    const mockAsyncFunction = someAsyncFunction as Mocked<
      typeof someAsyncFunction
    >;

    expect(mockAsyncFunction.mock.calls[0]).type.toBe<[Array<boolean>]>();

    expect(mockAsyncFunction.mockResolvedValue(123)).type.toRaiseError();
    expect(
      mockAsyncFunction.mockImplementation((a: Array<boolean>) =>
        Promise.resolve(true),
      ),
    ).type.toRaiseError();

    expect(someAsyncFunction).type.toBeAssignableWith(mockAsyncFunction);
  });

  test('wraps a function object type with type definitions of the Jest mock function', () => {
    interface SomeFunctionObject {
      (a: number, b?: string): void;
      one: {
        (oneA: number, oneB?: boolean): boolean;
        more: {
          time: (time: number) => void;
        };
      };
    }

    const someFunctionObject = {} as SomeFunctionObject;

    const mockFunctionObject = someFunctionObject as Mocked<
      typeof someFunctionObject
    >;

    expect(mockFunctionObject.mock.calls[0]).type.toBe<
      [a: number, b?: string]
    >();

    expect(mockFunctionObject.mockReturnValue(123)).type.toRaiseError();
    expect(
      mockFunctionObject.mockImplementation(() => true),
    ).type.toRaiseError();

    expect(mockFunctionObject.one.more.time.mock.calls[0]).type.toBe<
      [time: number]
    >();

    expect(
      mockFunctionObject.one.more.time.mockReturnValue(123),
    ).type.toRaiseError();
    expect(
      mockFunctionObject.one.more.time.mockImplementation((time: string) => {
        return;
      }),
    ).type.toRaiseError();

    expect(someFunctionObject).type.toBeAssignableWith(mockFunctionObject);
  });

  test('wraps an object type with type definitions of the Jest mock function', () => {
    class SomeClass {
      constructor(one: string, two?: boolean) {}

      methodA() {
        return true;
      }
      methodB(a: string, b?: number) {
        return;
      }
    }

    const someObject = {
      SomeClass,

      methodA() {
        return;
      },
      methodB(b: string) {
        return true;
      },
      methodC: (c: number) => true,

      one: {
        more: {
          time: (t: number) => {
            return;
          },
        },
      },

      propertyA: 123,
      propertyB: 'value',

      someClassInstance: new SomeClass('value'),
    };

    const mockObject = someObject as Mocked<typeof someObject>;

    expect(mockObject.methodA.mock.calls[0]).type.toBe<[]>();
    expect(mockObject.methodB.mock.calls[0]).type.toBe<[b: string]>();
    expect(mockObject.methodC.mock.calls[0]).type.toBe<[c: number]>();

    expect(mockObject.one.more.time.mock.calls[0]).type.toBe<[t: number]>();

    expect(mockObject.SomeClass.mock.calls[0]).type.toBe<
      [one: string, two?: boolean]
    >();
    expect(mockObject.SomeClass.prototype.methodA.mock.calls[0]).type.toBe<
      []
    >();
    expect(mockObject.SomeClass.prototype.methodB.mock.calls[0]).type.toBe<
      [a: string, b?: number]
    >();

    expect(mockObject.someClassInstance.methodA.mock.calls[0]).type.toBe<[]>();
    expect(mockObject.someClassInstance.methodB.mock.calls[0]).type.toBe<
      [a: string, b?: number]
    >();

    expect(mockObject.methodA.mockReturnValue(123)).type.toRaiseError();
    expect(
      mockObject.methodA.mockImplementation((a: number) => 123),
    ).type.toRaiseError();
    expect(mockObject.methodB.mockReturnValue(123)).type.toRaiseError();
    expect(
      mockObject.methodB.mockImplementation((b: number) => 123),
    ).type.toRaiseError();
    expect(mockObject.methodC.mockReturnValue(123)).type.toRaiseError();
    expect(
      mockObject.methodC.mockImplementation((c: number) => 123),
    ).type.toRaiseError();

    expect(mockObject.one.more.time.mockReturnValue(123)).type.toRaiseError();
    expect(
      mockObject.one.more.time.mockImplementation((t: boolean) => 123),
    ).type.toRaiseError();

    expect(
      mockObject.SomeClass.prototype.methodA.mockReturnValue(123),
    ).type.toRaiseError();
    expect(
      mockObject.SomeClass.prototype.methodA.mockImplementation(
        (a: number) => 123,
      ),
    ).type.toRaiseError();
    expect(
      mockObject.SomeClass.prototype.methodB.mockReturnValue(123),
    ).type.toRaiseError();
    expect(
      mockObject.SomeClass.prototype.methodB.mockImplementation(
        (a: number) => 123,
      ),
    ).type.toRaiseError();

    expect(
      mockObject.someClassInstance.methodA.mockReturnValue(123),
    ).type.toRaiseError();
    expect(
      mockObject.someClassInstance.methodA.mockImplementation(
        (a: number) => 123,
      ),
    ).type.toRaiseError();
    expect(
      mockObject.someClassInstance.methodB.mockReturnValue(123),
    ).type.toRaiseError();
    expect(
      mockObject.someClassInstance.methodB.mockImplementation(
        (a: number) => 123,
      ),
    ).type.toRaiseError();

    expect(someObject).type.toBeAssignableWith(mockObject);
  });

  test('wraps the global `console` object type with type definitions of the Jest mock function', () => {
    const mockConsole = console as Mocked<typeof console>;

    expect(console.log).type.toBeAssignableWith(
      mockConsole.log.mockImplementation(() => {}),
    );
    expect<MockInstance<typeof console.log>>().type.toBeAssignableWith(
      mockConsole.log.mockImplementation(() => {}),
    );
  });
});
