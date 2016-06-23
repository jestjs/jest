/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */

'use strict';

jest.disableAutomock();

const expect = require('../index.js');

describe('toBe()', () => {
  it(`doesn't throw`, () => {
    expect(1).toBe(1);
    expect(1).not.toBe(2);
  });
});

describe('toThrow', () => {
  it('throws when no error thrown', () => {    
    try {
      expect(() => {}).toThrow();
      throw new Error('should not be thrown');
    } catch (e) {
      expect(!!e.message.match(/to throw/)).toBe(true);
    }
  });
});
