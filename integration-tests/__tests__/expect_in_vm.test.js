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

test('expect works correctly with RegExps created inside a VM', () => {
  const result = runJest('expect-in-vm');
  expect(result.status).toBe(0);
});
