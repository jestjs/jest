/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export class SuperTestClass {
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
}
