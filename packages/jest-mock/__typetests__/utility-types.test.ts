/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expect, test} from 'tstyche';
import type {
  ClassLike,
  ConstructorLikeKeys,
  FunctionLike,
  MethodLikeKeys,
  PropertyLikeKeys,
} from 'jest-mock';

class SomeClass {
  propertyB = 123;
  private _propertyC: undefined;
  #propertyD = 'abc';

  constructor(public propertyA: string) {}

  methodA(): void {
    return;
  }

  methodB(b: string): string {
    return b;
  }

  get propertyC() {
    return this._propertyC;
  }
  set propertyC(value) {
    this._propertyC = value;
  }
}

class IndexClass {
  [key: string]: Record<string, any>;

  propertyB = {b: 123};
  private _propertyC = {c: undefined};
  #propertyD = 'abc';

  constructor(public propertyA: {a: string}) {}

  methodA(): void {
    return;
  }

  methodB(b: string): string {
    return b;
  }

  get propertyC() {
    return this._propertyC;
  }
  set propertyC(value) {
    this._propertyC = value;
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

const someObject = {
  SomeClass,

  methodA() {
    return;
  },
  methodB(b: string) {
    return true;
  },
  methodC: (c: number) => true,

  propertyA: 123,
  propertyB: 'value',

  someClassInstance: new SomeClass('value'),
};

type SomeObject = typeof someObject;

type IndexObject = {
  [key: string]: Record<string, any>;

  methodA(): void;
  methodB(b: string): boolean;
  methodC: (c: number) => boolean;

  propertyA: {a: number};
  propertyB: {b: string};
};

test('ClassLike', () => {
  expect<ClassLike>().type.toBeAssignableWith(SomeClass);

  expect<ClassLike>().type.not.toBeAssignableWith(() => {});
  expect<ClassLike>().type.not.toBeAssignableWith(function abc() {
    return;
  });
  expect<ClassLike>().type.not.toBeAssignableWith('abc');
  expect<ClassLike>().type.not.toBeAssignableWith(123);
  expect<ClassLike>().type.not.toBeAssignableWith(false);
  expect<ClassLike>().type.not.toBeAssignableWith(someObject);
});

test('FunctionLike', () => {
  expect<FunctionLike>().type.toBeAssignableWith(() => {});
  expect<FunctionLike>().type.toBeAssignableWith(function abc() {
    return;
  });

  expect<FunctionLike>().type.not.toBeAssignableWith('abc');
  expect<FunctionLike>().type.not.toBeAssignableWith(123);
  expect<FunctionLike>().type.not.toBeAssignableWith(false);
  expect<FunctionLike>().type.not.toBeAssignableWith(SomeClass);
  expect<FunctionLike>().type.not.toBeAssignableWith(someObject);
});

test('ConstructorKeys', () => {
  expect<ConstructorLikeKeys<OptionalInterface>>().type.toBe<
    'constructorA' | 'constructorB'
  >();
  expect<ConstructorLikeKeys<SomeObject>>().type.toBe<'SomeClass'>();
});

test('MethodKeys', () => {
  expect<MethodLikeKeys<SomeClass>>().type.toBe<'methodA' | 'methodB'>();
  expect<MethodLikeKeys<IndexClass>>().type.toBe<'methodA' | 'methodB'>();
  expect<MethodLikeKeys<OptionalInterface>>().type.toBe<
    'methodA' | 'methodB'
  >();
  expect<MethodLikeKeys<SomeObject>>().type.toBe<
    'methodA' | 'methodB' | 'methodC'
  >();
  expect<MethodLikeKeys<IndexObject>>().type.toBe<
    'methodA' | 'methodB' | 'methodC'
  >();
});

test('PropertyKeys', () => {
  expect<PropertyLikeKeys<SomeClass>>().type.toBe<
    'propertyA' | 'propertyB' | 'propertyC'
  >();
  expect<PropertyLikeKeys<IndexClass>>().type.toBe<string | number>();
  expect<PropertyLikeKeys<OptionalInterface>>().type.toBe<
    'propertyA' | 'propertyB' | 'propertyC' | 'propertyD'
  >();
  expect<PropertyLikeKeys<SomeObject>>().type.toBe<
    'propertyA' | 'propertyB' | 'someClassInstance'
  >();
  expect<PropertyLikeKeys<IndexObject>>().type.toBe<string | number>();
});
