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

test('require.resolve.paths', () => {
  const {status} = runJest('resolve-get-paths');
  expect(status).toBe(0);
});
