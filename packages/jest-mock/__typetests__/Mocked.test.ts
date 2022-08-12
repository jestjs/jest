/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectError, expectType} from 'tsd-lite';
import type {MockInstance, Mocked} from 'jest-mock';

/// mocks class

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

expectType<[one: string, two?: boolean | undefined]>(
  MockSomeClass.mock.calls[0],
);

expectType<[]>(MockSomeClass.prototype.methodA.mock.calls[0]);
expectType<[a: string, b?: number]>(
  MockSomeClass.prototype.methodB.mock.calls[0],
);

expectError(MockSomeClass.prototype.methodA.mockReturnValue('true'));
expectError(
  MockSomeClass.prototype.methodB.mockImplementation(
    (a: string, b?: string) => {
      return;
    },
  ),
);

expectType<[]>(MockSomeClass.mock.instances[0].methodA.mock.calls[0]);
expectType<[a: string, b?: number]>(
  MockSomeClass.prototype.methodB.mock.calls[0],
);

const mockSomeInstance = new MockSomeClass('a') as Mocked<
  InstanceType<typeof MockSomeClass>
>;

expectType<[]>(mockSomeInstance.methodA.mock.calls[0]);
expectType<[a: string, b?: number]>(mockSomeInstance.methodB.mock.calls[0]);

expectError(mockSomeInstance.methodA.mockReturnValue('true'));
expectError(
  mockSomeInstance.methodB.mockImplementation((a: string, b?: string) => {
    return;
  }),
);

expectAssignable<SomeClass>(mockSomeInstance);

// mocks function

function someFunction(a: string, b?: number): boolean {
  return true;
}

const mockFunction = someFunction as Mocked<typeof someFunction>;

expectType<[a: string, b?: number]>(mockFunction.mock.calls[0]);

expectError(mockFunction.mockReturnValue(123));
expectError(mockFunction.mockImplementation((a: boolean, b?: number) => true));

expectAssignable<typeof someFunction>(mockFunction);

// mocks async function

async function someAsyncFunction(a: Array<boolean>): Promise<string> {
  return 'true';
}

const mockAsyncFunction = someAsyncFunction as Mocked<typeof someAsyncFunction>;

expectType<[Array<boolean>]>(mockAsyncFunction.mock.calls[0]);

expectError(mockAsyncFunction.mockResolvedValue(123));
expectError(
  mockAsyncFunction.mockImplementation((a: Array<boolean>) =>
    Promise.resolve(true),
  ),
);

expectAssignable<typeof someAsyncFunction>(mockAsyncFunction);

// mocks function object

interface SomeFunctionObject {
  (a: number, b?: string): void;
  one: {
    (oneA: number, oneB?: boolean): boolean;
    more: {
      time: {
        (time: number): void;
      };
    };
  };
}

declare const someFunctionObject: SomeFunctionObject;

const mockFunctionObject = someFunctionObject as Mocked<
  typeof someFunctionObject
>;

expectType<[a: number, b?: string]>(mockFunctionObject.mock.calls[0]);

expectError(mockFunctionObject.mockReturnValue(123));
expectError(mockFunctionObject.mockImplementation(() => true));

expectType<[time: number]>(mockFunctionObject.one.more.time.mock.calls[0]);

expectError(mockFunctionObject.one.more.time.mockReturnValue(123));
expectError(
  mockFunctionObject.one.more.time.mockImplementation((time: string) => {
    return;
  }),
);

expectAssignable<SomeFunctionObject>(mockFunctionObject);

// mocks object

const mockConsole = console as Mocked<typeof console>;

expectAssignable<typeof console.log>(
  mockConsole.log.mockImplementation(() => {}),
);
expectAssignable<MockInstance<typeof console.log>>(
  mockConsole.log.mockImplementation(() => {}),
);
