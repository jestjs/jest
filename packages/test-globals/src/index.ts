/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  ClassLike,
  FunctionLike,
  Mock as JestMock,
  Mocked as JestMocked,
  MockedClass as JestMockedClass,
  MockedFunction as JestMockedFunction,
  MockedObject as JestMockedObject,
  UnknownFunction,
} from 'jest-mock';

declare global {
  const beforeAll: typeof import('@jest/globals')['beforeAll'];
  const beforeEach: typeof import('@jest/globals')['beforeEach'];

  const afterEach: typeof import('@jest/globals')['afterEach'];
  const afterAll: typeof import('@jest/globals')['afterAll'];

  const describe: typeof import('@jest/globals')['describe'];
  const fdescribe: typeof import('@jest/globals')['fdescribe'];
  const xdescribe: typeof import('@jest/globals')['xdescribe'];

  const it: typeof import('@jest/globals')['it'];
  const fit: typeof import('@jest/globals')['fit'];
  const xit: typeof import('@jest/globals')['xit'];

  const test: typeof import('@jest/globals')['test'];
  const xtest: typeof import('@jest/globals')['xtest'];

  const expect: typeof import('@jest/globals')['expect'];

  const jest: typeof import('@jest/globals')['jest'];

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    /**
     * Constructs the type of a mock function, e.g. the return type of `jest.fn()`.
     */
    export type Mock<T extends FunctionLike = UnknownFunction> = JestMock<T>;
    /**
     * Wraps a class, function or object type with Jest mock type definitions.
     */
    export type Mocked<T extends object> = JestMocked<T>;
    /**
     * Wraps a class type with Jest mock type definitions.
     */
    export type MockedClass<T extends ClassLike> = JestMockedClass<T>;
    /**
     * Wraps a function type with Jest mock type definitions.
     */
    export type MockedFunction<T extends FunctionLike> = JestMockedFunction<T>;
    /**
     * Wraps an object type with Jest mock type definitions.
     */
    export type MockedObject<T extends object> = JestMockedObject<T>;
  }
}
