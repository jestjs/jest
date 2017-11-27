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

it('Makes sure that no native module makes Jest crash', () => {
  const result = runJest.json('require-all-modules').json;

  if (!result.success) {
    console.warn(result);
  }

  expect(result.success).toBe(true);
});
