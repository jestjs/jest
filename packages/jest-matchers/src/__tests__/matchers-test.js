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

const expect = require('../index.js').expect;

describe('toBe()', () => {
  it(`doesn't throw`, () => {
    expect(1).toBe(1);
    expect(1).not.toBe(2);
  });

  it('throws', () => {
    let error;
    try {
      expect(1).toBe(2);
    } catch (e) {
      error = e;
    }

    expect(!!error.message.match('===')).toBe(true);
  });

  it('throws with .not', () => {
    let error;
    try {
      expect(1).not.toBe(1);
    } catch (e) {
      error = e;
    }

    expect(!!error.message.match('!==')).toBe(true);
  });

});
