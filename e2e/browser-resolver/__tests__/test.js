/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-env browser */

'use strict';

const div = require('../fake-pkg');

test('dummy test', () => {
  expect(div).toBeInstanceOf(HTMLDivElement);
});
