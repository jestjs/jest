/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectNotAssignable, expectType} from 'tsd-lite';
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

// ClassLike

expectAssignable<ClassLike>(SomeClass);
expectNotAssignable<ClassLike>(() => {});
expectNotAssignable<ClassLike>(function abc() {
  return;
});
expectNotAssignable<ClassLike>('abc');
expectNotAssignable<ClassLike>(123);
expectNotAssignable<ClassLike>(false);
expectNotAssignable<ClassLike>(someObject);

// FunctionLike

expectAssignable<FunctionLike>(() => {});
expectAssignable<FunctionLike>(function abc() {
  return;
});
expectNotAssignable<FunctionLike>('abc');
expectNotAssignable<FunctionLike>(123);
expectNotAssignable<FunctionLike>(false);
expectNotAssignable<FunctionLike>(SomeClass);
expectNotAssignable<FunctionLike>(someObject);

// ConstructorKeys

declare const interfaceConstructorKeys: ConstructorLikeKeys<OptionalInterface>;
declare const objectConstructorKeys: ConstructorLikeKeys<SomeObject>;

expectType<'constructorA' | 'constructorB'>(interfaceConstructorKeys);
expectType<'SomeClass'>(objectConstructorKeys);

// MethodKeys

declare const classMethods: MethodLikeKeys<SomeClass>;
declare const indexClassMethods: MethodLikeKeys<IndexClass>;
declare const interfaceMethods: MethodLikeKeys<OptionalInterface>;
declare const objectMethods: MethodLikeKeys<SomeObject>;
declare const indexObjectMethods: MethodLikeKeys<IndexObject>;

expectType<'methodA' | 'methodB'>(classMethods);
expectType<'methodA' | 'methodB'>(indexClassMethods);
expectType<'methodA' | 'methodB'>(interfaceMethods);
expectType<'methodA' | 'methodB' | 'methodC'>(objectMethods);
expectType<'methodA' | 'methodB' | 'methodC'>(indexObjectMethods);

// PropertyKeys

declare const classProperties: PropertyLikeKeys<SomeClass>;
declare const indexClassProperties: PropertyLikeKeys<IndexClass>;
declare const interfaceProperties: PropertyLikeKeys<OptionalInterface>;
declare const objectProperties: PropertyLikeKeys<SomeObject>;
declare const indexObjectProperties: PropertyLikeKeys<IndexObject>;

expectType<'propertyA' | 'propertyB' | 'propertyC'>(classProperties);
expectType<string | number>(indexClassProperties);
expectType<'propertyA' | 'propertyB' | 'propertyC' | 'propertyD'>(
  interfaceProperties,
);
expectType<'propertyA' | 'propertyB' | 'someClassInstance'>(objectProperties);
expectType<string | number>(indexObjectProperties);
