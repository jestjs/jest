// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.

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
