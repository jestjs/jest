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

const runJest = require('../runJest');

test('supports NODE_PATH', () => {
  const result = runJest('node_path', [], {
    nodePath: ['../node_path/src'],
  });
  expect(result.status).toBe(0);
});
