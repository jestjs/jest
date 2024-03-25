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
  expect<ClassLike>().type.toBeAssignable(SomeClass);

  expect<ClassLike>().type.not.toBeAssignable(() => {});
  expect<ClassLike>().type.not.toBeAssignable(function abc() {
    return;
  });
  expect<ClassLike>().type.not.toBeAssignable('abc');
  expect<ClassLike>().type.not.toBeAssignable(123);
  expect<ClassLike>().type.not.toBeAssignable(false);
  expect<ClassLike>().type.not.toBeAssignable(someObject);
});

test('FunctionLike', () => {
  expect<FunctionLike>().type.toBeAssignable(() => {});
  expect<FunctionLike>().type.toBeAssignable(function abc() {
    return;
  });

  expect<FunctionLike>().type.not.toBeAssignable('abc');
  expect<FunctionLike>().type.not.toBeAssignable(123);
  expect<FunctionLike>().type.not.toBeAssignable(false);
  expect<FunctionLike>().type.not.toBeAssignable(SomeClass);
  expect<FunctionLike>().type.not.toBeAssignable(someObject);
});

test('ConstructorKeys', () => {
  expect<ConstructorLikeKeys<OptionalInterface>>().type.toEqual<
    'constructorA' | 'constructorB'
  >();
  expect<ConstructorLikeKeys<SomeObject>>().type.toEqual<'SomeClass'>();
});

test('MethodKeys', () => {
  expect<MethodLikeKeys<SomeClass>>().type.toEqual<'methodA' | 'methodB'>();
  expect<MethodLikeKeys<IndexClass>>().type.toEqual<'methodA' | 'methodB'>();
  expect<MethodLikeKeys<OptionalInterface>>().type.toEqual<
    'methodA' | 'methodB'
  >();
  expect<MethodLikeKeys<SomeObject>>().type.toEqual<
    'methodA' | 'methodB' | 'methodC'
  >();
  expect<MethodLikeKeys<IndexObject>>().type.toEqual<
    'methodA' | 'methodB' | 'methodC'
  >();
});

test('PropertyKeys', () => {
  expect<PropertyLikeKeys<SomeClass>>().type.toEqual<
    'propertyA' | 'propertyB' | 'propertyC'
  >();
  expect<PropertyLikeKeys<IndexClass>>().type.toEqual<string | number>();
  expect<PropertyLikeKeys<OptionalInterface>>().type.toEqual<
    'propertyA' | 'propertyB' | 'propertyC' | 'propertyD'
  >();
  expect<PropertyLikeKeys<SomeObject>>().type.toEqual<
    'propertyA' | 'propertyB' | 'someClassInstance'
  >();
  expect<PropertyLikeKeys<IndexObject>>().type.toEqual<string | number>();
});
