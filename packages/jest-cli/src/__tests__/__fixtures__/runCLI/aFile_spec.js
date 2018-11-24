/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const expect = require('expect');
const aFile = require('./aFile');

describe('aFile test', () => {
  it('should have transformed aFile', () => {
    expect(JSON.stringify(aFile)).toEqual(JSON.stringify({runCLIReplaced: 1}));
  });
});
