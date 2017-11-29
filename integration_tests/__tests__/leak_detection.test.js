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

it('Makes sure that Jest does not leak the environment', () => {
  const result = runJest.json('leak-detection', ['--detectLeaks']).json;

  expect(result.success).toBe(true);
});
