/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectType} from 'tsd-lite';
import type {MethodKeys, PropertyKeys} from 'jest-mock';

interface SomeObject {
  methodA(): void;
  methodB(a: string): number;
  propertyA: number;
  propertyB: string;
}

declare const objectMethods: MethodKeys<SomeObject>;
declare const objectProperties: PropertyKeys<SomeObject>;

expectType<'methodA' | 'methodB'>(objectMethods);
expectType<'propertyA' | 'propertyB'>(objectProperties);

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

declare const classMethods: MethodKeys<SomeClass>;
declare const classProperties: PropertyKeys<SomeClass>;

expectType<'methodA' | 'methodB'>(classMethods);
expectType<'propertyA' | 'propertyB' | 'propertyC'>(classProperties);
