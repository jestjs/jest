/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectType} from 'tsd-lite';
import type {MockInstance, Mocked} from 'jest-mock';

/// mocks class

class ExampleClass {
  constructor(c: string, d?: boolean) {}

  //   _propertyB: false;

  methodA() {
    return true;
  }
  methodB(a: string, b: number) {
    return;
  }
  methodC(e: any) {
    throw new Error();
  }

  //   propertyA: 'abc',
}

const MockExampleClass = ExampleClass as Mocked<typeof ExampleClass>;

const xx = MockExampleClass.mock.calls[0];
const yy = MockExampleClass.prototype.methodB.mock.calls[0];

const ww = MockExampleClass.mock.instances[0].methodB.mock.calls[0];

const mockExample = new MockExampleClass('c') as Mocked<
  InstanceType<typeof MockExampleClass>
>;

const zz = mockExample.methodB.mock.calls[0];

/// mocks function

function someFunction(a: number, b?: string): boolean {
  return true;
}

async function someAsyncFunction(a: Array<boolean>): Promise<string> {
  return 'true';
}

const mockFunction = someFunction as Mocked<typeof someFunction>;

expectType<number>(mockFunction.mock.calls[0][0]);
expectType<string | undefined>(mockFunction.mock.calls[0][1]);

const mockFunctionResult = mockFunction.mock.results[0];

if (mockFunctionResult.type === 'return') {
  expectType<boolean>(mockFunctionResult.value);
}

const mockAsyncFunction = someAsyncFunction as Mocked<typeof someAsyncFunction>;

expectType<Array<boolean>>(mockAsyncFunction.mock.calls[0][0]);
// expectError(mockAsyncFunction.mock.calls[0][1]);

const mockAsyncFunctionResult = mockAsyncFunction.mock.results[0];

if (mockAsyncFunctionResult.type === 'return') {
  expectType<Promise<string>>(mockAsyncFunctionResult.value);
}

// mocks object

const mockConsole = console as Mocked<typeof console>;

expectAssignable<typeof console.log>(
  mockConsole.log.mockImplementation(() => {}),
);
expectAssignable<MockInstance<typeof console.log>>(
  mockConsole.log.mockImplementation(() => {}),
);
