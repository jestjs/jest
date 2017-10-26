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

test('works with nested event loops', () => {
  const result = runJest('nested_event_loop');
  expect(result.status).toBe(0);
});
