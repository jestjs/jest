/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

const runJest = require('../runJest');
const {extractSummary} = require('../Utils');

describe('--noErrorDetails switch', () => {
  test('suppresses printing the cause of a failed test', () => {
    const {stderr} = runJest('no-error-details', [
      'test_error.test.js',
      '--noErrorDetails',
    ]);
    expect(extractSummary(stderr).rest).toMatchSnapshot();
  });
});
