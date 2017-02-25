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
      a:43,
      b:'43',
      c:'fourtythree',
    };
    expect(test).toMatchSnapshot();
  });

  it('cannot be used with .not', () => {
    expect(() => expect('').not.toMatchSnapshot()).toThrow(
      'Jest: `.not` cannot be used with `.toMatchSnapshot()`.'
    );
  });

  // Issue reported here: https://github.com/facebook/jest/issues/2969
  it('works with \\r\\n', () => {
    expect('<div>\r\n</div>').toMatchSnapshot();
  });
});
