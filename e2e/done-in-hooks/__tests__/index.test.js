/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
describe('`done()` should work with hooks', done => {
  beforeEach(done => done());
  it('foo', () => {
    expect('foo').toMatch('foo');
  });
  it('bar', () => {
    expect('bar').toMatch('bar');
  });
});
