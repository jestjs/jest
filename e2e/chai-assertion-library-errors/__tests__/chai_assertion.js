/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';
const chai = require('chai');

describe('chai.js assertion library test', () => {
  it('expect', () => {
    chai.expect('hello world').to.equal('hello sunshine');
  });

  it('should', () => {
    chai.should();
    const expectedString = 'hello world';
    const actualString = 'hello sunshine';
    actualString.should.equal(expectedString);
  });

  it('assert', () => {
    chai.assert.strictEqual('hello world', 'hello sunshine');
  });
});
