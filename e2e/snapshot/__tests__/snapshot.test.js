/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
'use strict';

describe('snapshot', () => {
  it('works with plain objects and the title has `escape` characters', () => {
    const test = {
      a: 1,
      b: '2',
      c: 'three`',
    };
    expect(test).toMatchSnapshot();
    test.d = '4';
    expect(test).toMatchSnapshot();
  });

  it('is not influenced by previous counter', () => {
    const test = {
      a: 43,
      b: '43',
      c: 'fortythree',
    };
    expect(test).toMatchSnapshot();
  });

  it('cannot be used with .not', () => {
    expect(() => expect('').not.toMatchSnapshot()).toThrow(
      'Snapshot matchers cannot be used with not',
    );
  });

  // Issue reported here: https://github.com/jestjs/jest/issues/2969
  it('works with \\r\\n', () => {
    expect('<div>\r\n</div>').toMatchSnapshot();
  });
});
