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

test('does not crash when expect involving a DOM node fails', () => {
  const result = runJest('compare-dom-nodes');

  expect(result.stderr).toContain('FAIL __tests__/failed-assertion.js');
});
