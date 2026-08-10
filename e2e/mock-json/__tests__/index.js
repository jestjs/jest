/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

jest.mock('../data.json');

const extractData = require('../');

describe('extractData', () => {
  it('should read the data', () => {
    expect(extractData()).toEqual(['foo']);
  });
});
