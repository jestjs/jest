/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

jest.disableAutomock();

describe('matchers', () => {
  it('proxies matchers to jest-matchers', () => {
    // We can't use `expect().toThrow()` because `jest-matchers` error
    // is thrown in the framework context, and hence `e instanceof Error` will
    // return `false` and break jasmine
    try {
      expect(1).toBe(2);
      throw new Error('should not be thrown');
    } catch (e) {
      expect(e.message).toMatch(/expected.*to be.*===.*/);
    }
  });
});
