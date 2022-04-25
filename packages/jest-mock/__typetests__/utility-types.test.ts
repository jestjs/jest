/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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
