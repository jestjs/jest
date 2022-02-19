/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectAssignable, expectNotAssignable, expectType} from 'tsd-lite';
import type {
  ClassLike,
  FunctionLike,
  MethodKeys,
  PropertyKeys,
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

interface SomeObject {
  methodA(): void;
  methodB(a: string): number;
  propertyA: number;
  propertyB: string;
}

// ClassLike

expectAssignable<ClassLike>(SomeClass);
expectNotAssignable<ClassLike>(() => {});
expectNotAssignable<ClassLike>(function abc() {
  return;
});
expectNotAssignable<ClassLike>({} as SomeObject);
expectNotAssignable<ClassLike>('abc');
expectNotAssignable<ClassLike>(123);
expectNotAssignable<ClassLike>(false);

// FunctionLike

expectAssignable<FunctionLike>(() => {});
expectAssignable<FunctionLike>(function abc() {
  return;
});
expectNotAssignable<FunctionLike>({} as SomeObject);
expectNotAssignable<FunctionLike>(SomeClass);
expectNotAssignable<FunctionLike>('abc');
expectNotAssignable<FunctionLike>(123);
expectNotAssignable<FunctionLike>(false);

// MethodKeys

declare const classMethods: MethodKeys<SomeClass>;
declare const objectMethods: MethodKeys<SomeObject>;

expectType<'methodA' | 'methodB'>(classMethods);
expectType<'methodA' | 'methodB'>(objectMethods);

// PropertyKeys

declare const classProperties: PropertyKeys<SomeClass>;
declare const objectProperties: PropertyKeys<SomeObject>;

expectType<'propertyA' | 'propertyB' | 'propertyC'>(classProperties);
expectType<'propertyA' | 'propertyB'>(objectProperties);
