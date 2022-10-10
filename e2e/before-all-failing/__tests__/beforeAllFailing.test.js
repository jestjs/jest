/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

beforeAll(() => {
  throw new Error('Fail');
});

it('foo', () => {
  console.log('It Foo');
});

it.skip('foo 2', () => {
  console.log('It Foo 2');
});

it('bar', () => {
  console.log('It Bar');
});

describe('nested', () => {
  it('foo', () => {
    console.log('It Foo');
  });

  it.skip('foo 2', () => {
    console.log('It Foo 2');
  });

  it('bar', () => {
    console.log('It Bar');
  });
});
