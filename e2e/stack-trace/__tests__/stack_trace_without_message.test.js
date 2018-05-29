/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

test('fails with error without proper message', () => {
  const error = new Error('important message');
  error.stack = error.stack.replace('Error: important message', 'Error   ');
  throw error;
});
