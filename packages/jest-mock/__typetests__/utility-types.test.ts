/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectNotAssignable, expectType} from 'tsd-lite';
import type {
  ConstructorLike,
  ConstructorLikeKeys,
  MethodLike,
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

// ClassLike

expectAssignable<ConstructorLike>(SomeClass);
expectNotAssignable<ConstructorLike>(() => {});
expectNotAssignable<ConstructorLike>(function abc() {
  return;
});
expectNotAssignable<ConstructorLike>('abc');
expectNotAssignable<ConstructorLike>(123);
expectNotAssignable<ConstructorLike>(false);
expectNotAssignable<ConstructorLike>(someObject);

// FunctionLike

expectAssignable<MethodLike>(() => {});
expectAssignable<MethodLike>(function abc() {
  return;
});
expectNotAssignable<MethodLike>('abc');
expectNotAssignable<MethodLike>(123);
expectNotAssignable<MethodLike>(false);
expectNotAssignable<MethodLike>(SomeClass);
expectNotAssignable<MethodLike>(someObject);

// ConstructorKeys

declare const constructorKeys: ConstructorLikeKeys<SomeObject>;

expectType<'SomeClass'>(constructorKeys);

// MethodKeys

declare const classMethods: MethodLikeKeys<SomeClass>;
declare const objectMethods: MethodLikeKeys<SomeObject>;

expectType<'methodA' | 'methodB'>(classMethods);
expectType<'methodA' | 'methodB' | 'methodC'>(objectMethods);

// PropertyKeys

declare const classProperties: PropertyLikeKeys<SomeClass>;
declare const objectProperties: PropertyLikeKeys<SomeObject>;

expectType<'propertyA' | 'propertyB' | 'propertyC'>(classProperties);
expectType<'propertyA' | 'propertyB' | 'someClassInstance'>(objectProperties);
