/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest
  .unmock('react');

let React;

describe('snapshot', () => {

  beforeEach(() => {
    React = require('react');
  });

  it('works with plain objects', () => {
    const test = {
      a: 1,
      b: '2',
      c: 'three',
    };
    expect(JSON.stringify(test)).toMatchSnapshot();
    test.d = '4';
    expect(JSON.stringify(test)).toMatchSnapshot();
  });

});
