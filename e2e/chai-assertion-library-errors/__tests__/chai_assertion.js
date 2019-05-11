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
