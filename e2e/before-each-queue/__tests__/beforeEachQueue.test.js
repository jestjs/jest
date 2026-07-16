/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('test', () => {
  beforeEach(() => {
    console.log('BeforeEach');
  });

  it('foo', () => {
    console.log('It Foo');

    beforeEach(() => {
      console.log('BeforeEach Inline Foo');
    });
  });

  it('bar', () => {
    console.log('It Bar');

    beforeEach(() => {
      console.log('BeforeEach Inline Bar');
    });
  });
});
