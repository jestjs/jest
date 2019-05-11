/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
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
    const stringExpected = 'hello world';
    const actualExpected = 'hello sunshine';
    stringExpected.should.to.equal(actualExpected);
  });

  it('assert', () => {
    chai.assert.strictEqual('hello world', 'hello sunshine');
  });
});
