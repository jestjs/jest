/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {MockInstance} from './index';

type ClassLike = {new (...args: any): any};
type FunctionLike = (...args: any) => any;

export type MockedClass<T extends ClassLike> = MockInstance<
  (...args: ConstructorParameters<T>) => Mocked<InstanceType<T>>
> & {
  prototype: T extends {prototype: any} ? Mocked<T['prototype']> : never;
} & MockedObject<T>;

export type MockedFunction<T extends FunctionLike> = MockInstance<T> &
  MockedObject<T>;

export type MockedObject<T> = {
  [K in keyof T]: T[K] extends ClassLike
    ? MockedClass<T[K]>
    : T[K] extends FunctionLike
    ? MockedFunction<T[K]>
    : T[K] extends object
    ? MockedObject<T[K]>
    : T[K];
} & T;

export type Mocked<T> = T extends ClassLike
  ? MockedClass<T>
  : T extends FunctionLike
  ? MockedFunction<T>
  : T extends object
  ? MockedObject<T>
  : T;
