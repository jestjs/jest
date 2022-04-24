/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Jest} from '@jest/environment';
import type {JestExpect} from '@jest/expect';
import type {Global} from '@jest/types';
import type {
  ClassLike,
  FunctionLike,
  Mocked as JestMocked,
  MockedClass as JestMockedClass,
  MockedFunction as JestMockedFunction,
} from 'jest-mock';

export declare const expect: JestExpect;

export declare const it: Global.GlobalAdditions['it'];
export declare const test: Global.GlobalAdditions['test'];
export declare const fit: Global.GlobalAdditions['fit'];
export declare const xit: Global.GlobalAdditions['xit'];
export declare const xtest: Global.GlobalAdditions['xtest'];
export declare const describe: Global.GlobalAdditions['describe'];
export declare const xdescribe: Global.GlobalAdditions['xdescribe'];
export declare const fdescribe: Global.GlobalAdditions['fdescribe'];
export declare const beforeAll: Global.GlobalAdditions['beforeAll'];
export declare const beforeEach: Global.GlobalAdditions['beforeEach'];
export declare const afterEach: Global.GlobalAdditions['afterEach'];
export declare const afterAll: Global.GlobalAdditions['afterAll'];

declare const jest: Jest;

declare namespace jest {
  /**
   * Wraps a class, function or object type with definitions of Jest mock.
   */
  type Mocked<T extends object> = JestMocked<T>;
  /**
   * Wraps a class type with definitions of Jest mock.
   */
  type MockedClass<T extends ClassLike> = JestMockedClass<T>;
  /**
   * Wraps a function type with definitions of Jest mock.
   */
  type MockedFunction<T extends FunctionLike> = JestMockedFunction<T>;
}

export {jest};

throw new Error(
  'Do not import `@jest/globals` outside of the Jest test environment',
);
