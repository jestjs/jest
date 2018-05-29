/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fakeChalk = require.requireActual('../fake_chalk');

describe('Fake Chalk', () => {
  it('returns input when invoked', () => {
    expect(fakeChalk.red('yo')).toEqual('yo');
  });

  it('supports chaining', () => {
    expect(fakeChalk.red.blue('yo')).toEqual('yo');
  });
});
