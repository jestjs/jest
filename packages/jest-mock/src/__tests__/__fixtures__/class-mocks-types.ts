/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export default class SuperTestClass {
  static staticTestProperty = 'staticTestProperty';

  static get staticTestAccessor(): string {
    return 'staticTestAccessor';
  }

  static set staticTestAccessor(_x: string) {
    return;
  }

  static staticTestMethod(): string {
    return 'staticTestMethod';
  }

  static get(): string {
    return 'get';
  }

  static set(): string {
    return 'set';
  }

  testProperty = 'testProperty';

  get testAccessor(): string {
    return 'testAccessor';
  }
  set testAccessor(_x: string) {
    return;
  }

  testMethod(): string {
    return 'testMethod';
  }

  get(): string {
    return 'get';
  }

  set(): string {
    return 'set';
  }
}

export class TestClass extends SuperTestClass {}

export function testFunction1() {
  return 'testFunction1';
}

function testFunction() {
  return 'testFunction2';
}
export const testFunction2 = testFunction;

export const testFunction3 = () => {
  return 'testFunction3';
};
